export const PRESENCE_OPERATION = {
    HEARTBEAT:      'HB',
    DISCONNECT:     'DC',
    LOGOUT_DEVICE:  'LO',
    READ:           'READ',
} as const;

export type PresenceOperation = typeof PRESENCE_OPERATION[keyof typeof PRESENCE_OPERATION];

export const PRESENCE_TTL_MS = 60_000;

/**
 * Single atomic Lua script for all presence mutations and reads.
 *
 * KEYS[1]  = presence:{userId}
 * ARGV[1]  = operation  ('HB' | 'DC' | 'LO' | 'READ')
 * ARGV[2]  = target     field name for HB/DC ('device_<deviceId>:<tabId>')
 *                       deviceId prefix for LO ('device_<deviceId>:')
 *                       ignored for READ
 * ARGV[3]  = now        epoch ms (string)
 * ARGV[4]  = ttl        ms, defaults to 60000
 *
 * Returns: [status, lastSeenAt, transitioned]
 *   status      'true' | 'false'
 *   lastSeenAt  epoch ms string, '0' if never set
 *   transitioned 'online' | 'offline' | '' (empty = no transition)
 */
export const PRESENCE_LUA_SCRIPT = `
local key    = KEYS[1]
local op     = ARGV[1]
local target = ARGV[2]
local now    = tonumber(ARGV[3])
local ttl    = tonumber(ARGV[4]) or 60000

-- ── 1. Read current state ────────────────────────────────────
local data         = redis.call('HGETALL', key)
local old_status   = false
local last_seen_at = '0'
local stale_fields  = {}
local target_fields = {}

for i = 1, #data, 2 do
    local f, v = data[i], data[i + 1]
    if f == 'status' then
        old_status = (v == 'true')
    elseif f == 'lastSeenAt' then
        last_seen_at = v
    elseif string.sub(f, 1, 7) == 'device_' then
        if tonumber(v) + ttl < now then
            table.insert(stale_fields, f)
        end
        -- collect fields matching logout prefix in a single pass
        if op == 'LO' and string.sub(f, 1, #target) == target then
            table.insert(target_fields, f)
        end
    end
end

-- ── 2. Apply operation ───────────────────────────────────────
if op == 'HB' then
    -- Upsert own device field; guarantees ≥1 fresh field → status always true after HB
    redis.call('HSET', key, target, tostring(now))
elseif op == 'DC' then
    redis.call('HDEL', key, target)
elseif op == 'LO' and #target_fields > 0 then
    -- Remove all tabs of the same browser/device
    redis.call('HDEL', key, unpack(target_fields))
end
-- READ: no device-field mutation; only prune runs below

-- ── 3. Prune stale fields (skip already-mutated ones) ────────
local to_prune = {}
for _, f in ipairs(stale_fields) do
    local skip = false
    if (op == 'HB' or op == 'DC') and f == target then
        skip = true   -- HB just refreshed it; DC already deleted it
    elseif op == 'LO' then
        for _, tf in ipairs(target_fields) do
            if f == tf then skip = true; break end
        end
    end
    if not skip then table.insert(to_prune, f) end
end
if #to_prune > 0 then
    redis.call('HDEL', key, unpack(to_prune))
end

-- ── 4. Recompute fresh device count ─────────────────────────
local remaining   = redis.call('HGETALL', key)
local fresh_count = 0
for i = 1, #remaining, 2 do
    if string.sub(remaining[i], 1, 7) == 'device_' then
        if tonumber(remaining[i + 1]) + ttl >= now then
            fresh_count = fresh_count + 1
        end
    end
end

-- ── 5. Detect transition & persist ──────────────────────────
local new_status   = fresh_count > 0
local transitioned = ''

if new_status ~= old_status then
    transitioned = new_status and 'online' or 'offline'
    redis.call('HSET', key, 'status', new_status and 'true' or 'false')
    if not new_status then
        last_seen_at = tostring(now)
        redis.call('HSET', key, 'lastSeenAt', last_seen_at)
    end
end

-- ── 6. Return ────────────────────────────────────────────────
return { new_status and 'true' or 'false', last_seen_at, transitioned }
`;
