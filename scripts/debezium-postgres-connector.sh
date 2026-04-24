#!/bin/bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI_CONNECT_INPUT="${1:-}"
CONNECTOR_TEMPLATE_PATH="$ROOT_DIR/scripts/connectors/social-chat-postgres-connector.json"
CONNECTOR_NAME="${CONNECTOR_NAME:-social-chat-postgres-connector}"

if [ -f "$ROOT_DIR/config/.env.common" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/config/.env.common"
  set +a
else
  echo "config/.env.common not found (expected at $ROOT_DIR/config/.env.common)" >&2
  exit 1
fi

DEFAULT_CONNECT_PORT="${CONNECT_PORT:-8083}"
DEFAULT_CONNECT_URL="${CONNECT_URL:-http://localhost:${DEFAULT_CONNECT_PORT}}"
CONNECT_URL="$DEFAULT_CONNECT_URL"

if [ -n "$CLI_CONNECT_INPUT" ]; then
  if [[ "$CLI_CONNECT_INPUT" =~ ^https?:// ]]; then
    CONNECT_URL="$CLI_CONNECT_INPUT"
  else
    CONNECT_URL="http://localhost:$CLI_CONNECT_INPUT"
  fi
fi

# Strip trailing slash and auto-append :8083 if the URL has no explicit port.
CONNECT_URL="${CONNECT_URL%/}"
if [[ "$CONNECT_URL" =~ ^https?://[^/:]+$ ]]; then
  CONNECT_URL="${CONNECT_URL}:${DEFAULT_CONNECT_PORT}"
fi

# Fail fast if any required DB var is missing — otherwise envsubst silently
# produces an empty string and Debezium fails with a cryptic connection error.
: "${DB_HOST:?DB_HOST not set (check config/.env.common)}"
: "${DB_PORT:?DB_PORT not set (check config/.env.common)}"
: "${DB_USERNAME:?DB_USERNAME not set (check config/.env.common)}"
: "${DB_PASSWORD:?DB_PASSWORD not set (check config/.env.common)}"
: "${DB_DATABASE:?DB_DATABASE not set (check config/.env.common)}"

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required but was not found in PATH." >&2
  exit 1
fi

if [ ! -f "$CONNECTOR_TEMPLATE_PATH" ]; then
  echo "Connector template not found at $CONNECTOR_TEMPLATE_PATH" >&2
  exit 1
fi

echo "=================================================="
echo "Applying Debezium Postgres connector to Kafka Connect"
echo "Kafka Connect URL: $CONNECT_URL"
echo "Connector name: $CONNECTOR_NAME"
echo "Database host: ${DB_HOST:-unset}"
echo "Database name: ${DB_DATABASE:-unset}"
echo "=================================================="

RENDERED_CONNECTOR_FILE="$(mktemp)"
RENDERED_CONNECTOR_CONFIG_FILE="$(mktemp)"
trap 'rm -f "$RENDERED_CONNECTOR_FILE" "$RENDERED_CONNECTOR_CONFIG_FILE"' EXIT

# Only substitute the DB_* vars — prevents accidental expansion of anything
# else that might look like a shell variable inside the JSON.
envsubst '${DB_HOST} ${DB_PORT} ${DB_USERNAME} ${DB_PASSWORD} ${DB_DATABASE}' \
  < "$CONNECTOR_TEMPLATE_PATH" > "$RENDERED_CONNECTOR_FILE"

# Sanity check: if any ${VAR} placeholder remains, fail loudly instead of
# sending a half-rendered template to Kafka Connect.
if grep -q '\${[A-Za-z_][A-Za-z0-9_]*}' "$RENDERED_CONNECTOR_FILE"; then
  echo "Unresolved placeholders in rendered connector template:" >&2
  grep -o '\${[A-Za-z_][A-Za-z0-9_]*}' "$RENDERED_CONNECTOR_FILE" | sort -u >&2
  exit 1
fi
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(JSON.stringify(data.config));" \
  "$RENDERED_CONNECTOR_FILE" > "$RENDERED_CONNECTOR_CONFIG_FILE"

if curl -sf "$CONNECT_URL/connectors/$CONNECTOR_NAME" >/dev/null; then
  echo "Connector exists. Updating config..."
  curl --fail-with-body -sS -X PUT "$CONNECT_URL/connectors/$CONNECTOR_NAME/config" \
    -H "Content-Type: application/json" \
    -d @"$RENDERED_CONNECTOR_CONFIG_FILE"
  echo
  echo "Connector updated successfully."
else
  echo "Connector not found. Creating..."
  curl --fail-with-body -sS -X POST "$CONNECT_URL/connectors" \
    -H "Content-Type: application/json" \
    -d @"$RENDERED_CONNECTOR_FILE"
  echo
  echo "Connector created successfully."
fi

