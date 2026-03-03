# Kong API Gateway

This document describes the Kong Gateway setup for the Social Chat platform.

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Kong Gateway              │
                    │              :3000                  │
                    │  ┌─────────────────────────────┐    │
                    │  │ Plugins:                    │    │
                    │  │ - CORS                      │    │
                    │  │ - Rate Limiting             │    │
                    │  │ - Request Transformer       │    │
                    │  │ - Response Transformer      │    │
                    │  └─────────────────────────────┘    │
                    └─────────────┬───────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │ Auth Service│    │ User Service│    │ ... more    │
       │    :3001    │    │    :3002    │    │  services   │
       └─────────────┘    └─────────────┘    └─────────────┘
```

## Quick Start

### 1. Start Infrastructure

```bash
# Start all Docker services including Kong
yarn docker:up

# Wait for Kong to be healthy (check status)
yarn kong:status
```

### 2. Configure Kong Routes

```bash
# Run the Kong setup script
yarn kong:setup
```

### 3. Start Application Services

```bash
# Terminal 1: Start Auth Service
yarn dev:auth

# Terminal 2: Start User Service
yarn dev:user
```

### 4. Test the Gateway

```bash
# Test auth service through gateway
curl http://localhost:3000/auth/login?redirect_uri=http://localhost:4000

# Test user service through gateway (requires auth token)
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/users/profile
```

## Routing Configuration

| Gateway Path | Target Service | Port |
|--------------|----------------|------|
| `/auth/*`    | auth-service   | 3001 |
| `/users/*`   | user-service   | 3002 |

## Kong Ports

| Port | Description |
|------|-------------|
| 3000 | Proxy port (client requests) |
| 3443 | Proxy SSL port |
| 8001 | Admin API |
| 8002 | Kong Manager (Admin GUI) |

## Environment Variables

Add these to your `.env` file:

```env
# Kong Database
KONG_PG_PASSWORD=kongpass

# Kong Admin URL (for setup scripts)
KONG_ADMIN_URL=http://localhost:8001
KONG_PROXY_URL=http://localhost:3000

# Service URLs (used by Kong to route requests)
AUTH_SERVICE_URL=http://host.docker.internal:3001
USER_SERVICE_URL=http://host.docker.internal:3002
```

## Plugins Configured

### Global Plugins

1. **CORS** - Cross-Origin Resource Sharing
   - Origins: `*`
   - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   - Credentials: true

2. **Rate Limiting**
   - 100 requests per minute
   - 1000 requests per hour

3. **Request Transformer**
   - Adds `X-Gateway-Request: true` header

4. **Response Transformer**
   - Adds `X-Kong-Proxy: true` header

## Admin Commands

```bash
# Check Kong status
yarn kong:status

# List all services
yarn kong:services

# List all routes
yarn kong:routes

# List all plugins
yarn kong:plugins

# View Kong logs
docker logs -f social-chat-kong
```

## Adding New Services

To add a new microservice to Kong, update the `scripts/kong-setup.sh` file:

```bash
# 1. Add the service
create_service "new-service" "http://host.docker.internal:300X"

# 2. Add the route
create_route "new-service" "new-routes" '["/new-path"]' false
```

Then run:
```bash
yarn kong:setup
```

## Troubleshooting

### Kong is not starting

Check if the Kong database is ready:
```bash
docker logs social-chat-kong-db
```

Check Kong migrations:
```bash
docker logs social-chat-kong-migrations
```

### Routes not working

1. Verify services are registered:
   ```bash
   curl http://localhost:8001/services
   ```

2. Verify routes are configured:
   ```bash
   curl http://localhost:8001/routes
   ```

3. Check if backend services are running:
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3002/health
   ```

### Connection refused to backend

On Windows/Mac, use `host.docker.internal` to access host machine services from Docker.

On Linux, you may need to use the host's IP address or configure Docker networking.

## JWT Validation

JWT validation is handled by the downstream services (Auth and User services), not by Kong. This design allows:

- Flexibility in authentication mechanisms
- Services to use Keycloak tokens directly
- Easier migration to other auth providers

If you need Kong-level JWT validation, consider:
1. Using Kong's JWT plugin with a shared secret
2. Using Kong's OpenID Connect plugin (Enterprise only)
3. Implementing a custom plugin
