# WebSocket Deep Dive — Resume Doc

**Started:** 2026-05-11
**Format:** 7-layer guided tutorial, tutor-led with check-for-understanding probes between layers.
**Why this doc:** so the user can resume the *concept* track tomorrow without the *implementation* track interfering.

## How to resume

**Deep dive is COMPLETE as of 2026-05-16.** All 7 layers walked. This doc serves as a reference / cheat sheet now — the user can review any layer's section without needing the live walkthrough.

If the user asks to "refresh layer N" or wants a specific topic re-explained, point them to the section and answer specific questions; don't re-walk the whole layer. If they explicitly want to *re-walk*, do so with fresh probes — don't just recite the prior writeup.

Do NOT re-explain prior layers unless the user asks. Layer 2 was originally written up speculatively without an actual walkthrough — wiped 2026-05-12 and restarted fresh; see [[feedback_progress_docs_only_reflect_actual_walks]].

---

## The 7-layer roadmap

| # | Layer | Status |
|---|-------|--------|
| 1 | Why WebSocket exists (the problem) | ✅ DONE 2026-05-11 |
| 2 | The HTTP-upgrade handshake | ✅ DONE 2026-05-12 (restart — walked properly with probes) |
| 3 | The frame format (opcodes, masking, length encoding, fragmentation) | ✅ DONE 2026-05-12 |
| 4 | Connection lifecycle (open/data/ping-pong/close, NAT timeouts, proxy idle) | ✅ DONE 2026-05-12 |
| 5 | Auth and security (Origin header, CSRF on WS, handshake auth options) | ✅ DONE 2026-05-16 |
| 6 | Scaling — sticky sessions and cross-pod fan-out | ✅ DONE 2026-05-16 |
| 7 | What socket.io adds on top of raw WS (engine.io, polling fallback, rooms, acks) | ✅ DONE 2026-05-16 |

**🎉 Deep dive COMPLETE 2026-05-16.** All 7 layers walked with probes. Return to Story 6.2 implementation (smoke test + Kafka path pending).

---

## Layer 1 — what was covered ✅

**Headline:** HTTP is request-response client-initiated. Server cannot speak first. Chat needs server push. WebSocket is the clean answer; everything else (short-poll, long-poll, SSE) is a workaround.

**Alternatives walked through (with costs):**

- **Short polling** — high latency OR high CPU/bandwidth waste. Stateless, simple. Used for things that can tolerate 30s+ latency.
- **Long polling** — server holds connection until data or timeout. Sub-second latency BUT: full HTTP headers per push, unidirectional (still need separate POST to send), stateful at server.
- **SSE** — cleaner long-polling, native HTML5 `EventSource`, auto-reconnect with `Last-Event-ID`. BUT: unidirectional, text-only, HTTP/1.1 6-connection-per-origin limit bites. Great for stock tickers and AI streaming (ChatGPT uses SSE!). Wrong for chat.
- **WebSocket** — HTTP upgrades to bidirectional binary-capable persistent connection. 2-14 byte frame overhead vs ~1KB HTTP headers. One connection for send + receive.

**Concrete cost comparison @ 100 messages/hour per user:**

| Approach | Overhead/msg | Total/hr |
|----------|--------------|----------|
| Long-poll | ~1500 bytes | ~150 KB |
| SSE + POST | ~800 bytes | ~80 KB |
| WebSocket | 2-14 bytes | ~1 KB |

**The trade-off WS makes:** stateful → connection pinned to one server pod → load balancers must be sticky → cross-pod delivery needs Redis/Kafka fan-out (layer 6 + story 6.4).

### Layer 1 probes — user's answers + supplements

**Q1.** Why isn't HTTP/2 push a solution to chat?

User's answer: "old devices don't support it; still need HTTP for send."

Supplement covered:
- **Primary reason:** push is request-coupled, not spontaneous. Server can only push *in response to* a client request, not at arbitrary times. So when Bob sends a message, there's no outstanding request to push it against.
- Pushed resources go into HTTP cache, not JS event loop — no `onPush(callback)` API.
- Effectively killed: Chrome v106 (2022) removed it.

**Q2.** Latency-wise long-poll/SSE also achieve sub-second. Why does chat *force* WS?

User's answer: "bidirectional communication."

Supplement covered:
- Two-channel state-sync problem: when user POSTs a message, server has to route the echo back to the user's open recv channel (possibly different pod). One state machine vs two.
- Browser 6-connection-per-origin limit makes 2 channels expensive.
- Small frequent events (typing, presence, read receipts) — ~1KB HTTP headers per 10-byte payload is brutal at scale; WS frames are bytes.
- Mobile network handoffs break TCP — reconnect once with WS vs twice with two channels.

**Q3.** Short-polling vs long-polling: which is harder for the backend, and why "depends on runtime"?

User's answer: "Short polling harder, it spams the app and adds network round trips."

Supplement covered:
- Short-poll cost shape = **CPU + bandwidth** (every poll is a full HTTP cycle, even empty).
- Long-poll cost shape = **memory + file descriptors** (one held socket per idle user).
- **Runtime matters:** Node/Go/Rust-async/Java-NIO multiplex idle sockets via epoll/kqueue — 10K idle = cheap. Classic thread-per-request runtimes (Java Servlet, PHP-FPM, Apache prefork) burn a whole worker per held connection — 10K idle = 10GB RAM gone. That's why long-polling went mainstream around the same time async runtimes did (~2009).
- General lesson: "which approach is cheaper" is a property of protocol *plus runtime concurrency model*, not protocol alone.

---

## Layer 2 — what was covered ✅ (walked 2026-05-12)

**Headline:** WS handshake is a real HTTP/1.1 `GET` request that hijacks the TCP socket. After server sends `101 Switching Protocols`, both ends switch their byte parsers from HTTP to WS frame format on the *same* socket — no reconnect, no new port.

### Handshake on the wire

Request (client → server):
```
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://example.com
Sec-WebSocket-Protocol: chat, mqtt
Sec-WebSocket-Extensions: permessage-deflate
\r\n
```

Response (server → client):
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
\r\n
```

The trailing empty line is critical — HTTP has no length prefix on headers, so the empty line is the *only* signal that the header block is complete.

### Header semantics

- `GET` mandatory, `HTTP/1.1` mandatory — chosen so any HTTP server library can parse the request, and so corporate firewalls let it through (camouflage as normal web traffic).
- `Upgrade: websocket` + `Connection: Upgrade` — together signal "switch protocols on this hop."
- `Sec-WebSocket-Version: 13` — pin to RFC 6455 (the current and only deployed version).
- `Origin` — sent by browsers only. Useful for CSRF defense against *browsers*. Useless against curl/Node/mobile/IoT (they don't send it, or send any value they want). Don't use as auth.
- `Sec-WebSocket-Protocol` — subprotocol negotiation. Ignored by most apps; used by MQTT-over-WS, STOMP-over-WS, etc.
- `Sec-WebSocket-Extensions` — wire-level. Common: `permessage-deflate`. CPU↔bandwidth trade-off; has had RCE-class CVEs in some implementations. Disabled by default in socket.io.

### Sec-WebSocket-Key / Accept — what it actually defends

Mechanism: client sends 16 random bytes base64-encoded as `Key`; server computes `base64(SHA1(Key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))` and returns it as `Accept`. **The GUID is public — in the RFC.** Zero authentication value.

The dance defends against **accidents in HTTP infrastructure**, NOT against attackers:

1. **Cross-protocol confusion.** A non-WS server can't produce the correct hash. Misdirected handshakes get rejected by the client before any WS frames flow.
2. **Cache poisoning.** Random per-request Key → any cached response will have a stale Accept → client recomputes and detects mismatch → aborts. Belt-and-suspenders alongside `Cache-Control: no-store`.
3. **Old/clueless intermediaries.** Proxies that strip or mangle headers break the Accept hash, client aborts before sending WS frames.

**Threat-model separation (lock this in):**

| Threat | Defense |
|---|---|
| Accidents in HTTP infra (caches, dumb proxies, misrouting) | Sec-WebSocket-Key/Accept dance |
| Active attackers (MitM, frame injection, forged 101 response) | TLS (`wss://`) |

Two independent defenses against two different threats. Plain `ws://` is fine against accidents and totally exposed to attackers. Always `wss://` in prod.

### Same-socket protocol switch

After `101`, the TCP socket stays open. **No new connection.** Both ends swap their byte parser from HTTP to WS-frame parser. The very next byte after the `\r\n\r\n` ending the `101` response = first byte of the first WS frame (Layer 3 material).

### Production gotchas covered

- **CloudFront / nginx / ALB must be WS-aware.** Disabled-by-default on CloudFront — must toggle `WebsocketsEnabled`. Nginx requires `proxy_http_version 1.1` + Upgrade/Connection forwarding. ALB works by default but sticky sessions matter (Layer 6).
- **Browser JS WS API cannot set arbitrary headers.** Only `protocols` arg accepted. So in-browser JWT options are: (a) `HttpOnly` cookie auto-attached on same-origin handshake [best], (b) query string `?token=...` [worst — leaks to logs/Referer], (c) abuse `Sec-WebSocket-Protocol` as a token carrier [hack but common].
- **Pre-handshake auth >> post-handshake auth.** Reject with HTTP `401` before the upgrade completes:
  - Cheaper (~50µs vs ~500µs–1ms per rejection — 10–20× ratio)
  - Smaller DoS surface
  - Auth failures land in HTTP access logs, not WS close events
- socket.io's `auth` field is technically post-handshake (it's the first frame after upgrade), but socket.io's middleware rejects before any app event fires — close enough in practice.

### Layer 2 probes — answered

- **P1 (empty `\r\n` line).** Correct: it terminates the HTTP header block; HTTP has no length prefix, so without it the server parser blocks forever.
- **P2 (firewall).** Walked: WS rides HTTP/1.1 + port 80/443 specifically *for firewall camouflage* — the handshake looks like normal HTTP, dumb firewalls let it through.
- **P3 (MitM forge 101).** Correct: on plain `ws://`, an attacker can forge a valid handshake response because the GUID is public. TLS prevents this. Dance ≠ attacker defense; TLS = attacker defense.
- **Q1 (CloudFront).** Walked: Key/Accept detects cache hits client-side, but the bigger production failure is CloudFront stripping the Upgrade header when WS support isn't enabled on the distribution. Cache poisoning is the rarer failure mode.
- **Q2 (server echoes key as Accept).** Correct: client recomputes hash, mismatch, browser fires error + close code 1006.
- **Q3 (JWT during handshake).** Walked: header/cookie in handshake; browser JS API gotcha (no custom headers); pre-handshake auth beats post-handshake for cost + observability + DoS reasons.

---

## Layer 3 — what was covered ✅ (walked 2026-05-12)

**Headline:** WS achieves 2–14 byte per-frame overhead via a compact binary frame format. Three design decisions matter: opcodes split data vs control, masking defends against HTTP proxy cache-poisoning, and tiered length encoding optimizes for small frequent messages.

### Frame structure (RFC 6455)

```
FIN(1) RSV(3) opcode(4) | MASK(1) len(7) | [ext len 16 or 64] | [mask key 32] | payload(N)
```

Minimum header = 2 bytes. Maximum header = 14 bytes (mask + 64-bit length).

### Opcodes — two families

- **Data:** 0x0 continuation, 0x1 text (UTF-8), 0x2 binary
- **Control:** 0x8 close, 0x9 ping, 0xA pong
- Control frames: payload ≤125 bytes, cannot fragment (FIN must be 1), can interleave between fragments of a data message

### Masking — client→server only, why it exists

- Client MUST mask payload with random 4-byte key (sent plaintext in same frame). Server MUST NOT mask.
- Masking key being plaintext is fine — defense is not secrecy, it's **scrambling crafted bytes so transparent HTTP proxies can't misparse them**.
- **The historic attack (Barth/Nir 2010):** malicious browser JS opens WS, sends crafted payload bytes that read like `GET /victim/path HTTP/1.1\r\nHost: bank.com\r\n...`. Transparent caching proxy in between sees what looks like an HTTP request, fetches/caches the response keyed by URL → cache poisoning affects all victims behind that proxy.
- Masking with per-frame random key turns the on-wire bytes into garbage from the proxy's pattern-matching perspective. Attack defeated.
- Server doesn't mask because server output is trusted — attacker isn't running code on the server. Saved CPU.
- **Same theme as Sec-WebSocket-Key/Accept dance:** defense against legacy HTTP infra accidents, NOT against active attackers reading the wire (that's TLS).

### Length encoding — three sizes, no 32-bit

| 7-bit value | Interpretation | Effective length |
|---|---|---|
| 0..125 | inline | 7 bits |
| 126 | next 2 bytes | 16 bits (≤64KB) |
| 127 | next 8 bytes | 64 bits (top bit must be 0 → 63 effective) |

**Why three encodings:** small messages are wildly common in real apps (chat msgs ~50B). Always-64-bit would mean 10-byte header per frame instead of 2 → 16% bloat on small frames. At scale this is meaningful (1M users × 100 msg/hr × 2 directions × 8 bytes saved ≈ 14 TB/yr bandwidth saved).

**Why no 32-bit option:** added parser-branch complexity for marginal gain. If >64KB, you should fragment (see below) instead of one giant frame.

**Why 64-bit reserves top bit:** languages without clean unsigned 64-bit ints (JS pre-BigInt, early Java) would parse top-bit-set as negative. Spec dodges by reserving.

### Fragmentation — FIN + continuation opcode

A logical message can be split across multiple frames:
- First frame: opcode = data type (text/binary), FIN=0
- Middle frames: opcode = 0x0 (continuation), FIN=0
- Last frame: opcode = 0x0 (continuation), FIN=1

**Why fragmentation exists:**
1. Streaming sends (you don't know the total size up front).
2. Receiver memory (process chunks vs. buffer whole message).
3. Control-frame interleaving — ping/pong/close can be inserted *between* data fragments. Without fragmentation, a long send blocks keepalive entirely.

**What breaks with one giant frame:**
- Head-of-line blocking: WS frames are ordered on one socket, so a 5MB write blocks ping/pong → peer thinks connection is dead → disconnect.
- Receiver memory: must allocate full payload size up front.
- NAT/proxy idle timeouts may fire during the long send.
- DoS surface: no opportunity to enforce per-fragment limits.

### Layer 3 probes — answered

- **Q1 (masking asymmetry).** Correct: proxy cache-poisoning defense. Server doesn't mask because server output is trusted.
- **Q2 (three length encodings).** Correct: always-64-bit wastes bytes on small payloads. No 32-bit because parser complexity > marginal benefit; fragment instead.
- **Q3 (fragmentation).** Walked: streaming/memory/control-frame interleaving. One giant frame causes head-of-line blocking and timeout failures.

---

## Layer 4 — what was covered ✅ (walked 2026-05-12)

**Headline:** TCP "open" ≠ WS "alive." Real production failure modes are not graceful close — they're NAT eviction, proxy idle kills, mobile cell handoffs, and crashes. WS adds application-level liveness via ping/pong. State cleanup must use TTLs, not disconnect handlers.

### Why TCP isn't enough

TCP guarantees: bytes arrive in order or eventually fail. TCP does NOT guarantee: prompt notification when the peer disappears. Five real failure modes leave TCP saying `ESTABLISHED` while the WS connection is actually dead:

1. **NAT entry expiry** — carrier NATs evict idle entries (~30s mobile, ~5min residential). Server packets get dropped silently.
2. **Proxy idle timeouts** — AWS ALB 60s default, CloudFlare 100s, nginx 60s. No traffic → proxy closes the socket.
3. **Mobile cell handoffs** — IP changes when phone moves between towers. TCP RST or silent drop.
4. **Laptop suspend** — kernel suspends I/O, browser JS event loop freezes. Server still thinks connection alive.
5. **Half-open** — server kernel panic leaves no FIN/RST. Client never learns.

### Ping/pong — the WS liveness mechanism

- Control frames: opcode 0x9 (PING), 0xA (PONG). Pong MUST echo ping's payload promptly.
- **Spec mandates the response, not the cadence** — interval is app-defined.
- **Two jobs:** liveness detection (peer responds within timeout) AND middlebox keepalive (traffic resets NAT/proxy idle timers).
- **Rule of thumb:** ping interval < ½ × shortest idle timeout in path. For ALB (60s) + mobile NAT (~30s), 25s is good.
- **socket.io defaults:** `pingInterval: 25000ms` + `pingTimeout: 20000ms`. Server pings; client must pong within 20s. Defaults are ALB-safe and mobile-safe.

### Close handshake + status codes

- Close frame opcode 0x8, 2-byte code + reason string.
- 1000 normal, 1001 going-away, 1002 protocol-error, 1003 unsupported-data
- **1006 abnormal closure — RESERVED, never on wire.** Synthesized locally when TCP dies without a CLOSE frame. The "something went wrong" code in browser console for NAT eviction / crashes / network failure.
- 1008 policy-violation (often used for auth fail), 1009 message-too-big, 1011 internal-error
- 4000-4999 application-defined

### TTL-based state cleanup (the critical pattern)

**`handleDisconnect` is best-effort, not guaranteed.** Fires reliably for:
- NAT eviction / proxy kill / cell handoff (after ping/pong timeout, ~45s in defaults)
- Graceful client close (immediate)

**Does NOT fire for:**
- Gateway process crash / OOM kill / pod restart
- Network partition between gateway and Redis (gateway alive but state writes fail silently)

**Consequence:** any session state in shared storage (Redis presence, "online" markers) becomes stale if you rely on `handleDisconnect` for cleanup.

**Fix — self-expiring state:**
```ts
// Right: TTL on connect, refresh on each ping
handleConnection(socket) {
  redis.set(`user:${userId}:online`, socket.id, 'EX', 60);
}
onPing() {
  redis.expire(`user:${userId}:online`, 60);
}
// handleDisconnect still tries del() but it's belt-and-suspenders, not load-bearing
```

If gateway crashes, TTL expires within 60s → world becomes correct without intervention.

**Pattern to internalize:** session-bound state in shared storage must be self-expiring, never handler-cleaned. This will come up again in Layer 6 (scaling) and Story 6.4 (fan-out + presence).

### Reconnect + missed messages

- socket.io has reconnection built-in (exponential backoff 1s → 5s, infinite retries by default).
- The real production problem is NOT reconnecting — it's **catching up on messages missed during disconnect**. Requires a "give me everything since cursor T" API + client-side dedup. Deferred to Story 6.4.

### Layer 4 probes — answered

- **P1 (socket.io defaults vs ALB).** Correct: 25s < 60s, defaults work. Also tuned to beat ~30s mobile NAT.
- **P2 (laptop suspend).** Walked: socket.io reconnect handles the connection itself; missed-messages catch-up is the harder problem (Story 6.4).
- **P3 (handleDisconnect reliability).** Correct on timing; user missed the critical exception — gateway crash means handler NEVER runs. Walked TTL-based state cleanup as the fix.

---

## Layer 5 — what was covered ✅ (walked 2026-05-16)

**Headline:** WS auth lives in a security model that doesn't match HTTP's. No CORS preflight on the handshake, `Origin` is browser-only-trustworthy, and the browser's native WS API can't set arbitrary headers — three constraints that drive every design choice. CSWSH is a real attack class. Origin allowlist and per-user auth are independent defenses; you need both.

### CSWSH — Cross-Site WebSocket Hijacking

When `evil.com` runs `new WebSocket('wss://bank.com/ws')`:

- Browser sends the handshake with `bank.com`'s cookies attached (cookie store keys by destination, not initiator).
- **No CORS preflight.** Spec-mandated absence. `Access-Control-Allow-Origin` is not checked on the `101` response.
- Only browser-side defense: **mixed-content blocking** — an `https://` page cannot open `ws://`, only `wss://`. That's it.
- The only signal of cross-origin initiation: the `Origin` header on the handshake.

**Defense: server-side `Origin` allowlist during handshake.** Reject (HTTP 403) if `Origin` doesn't match. There is NO built-in browser protection. Attack class first documented by Christian Schneider ~2013, still a regular pentest finding.

### Origin header threat model

- Browsers send `Origin` truthfully (JS cannot override it).
- Non-browser clients (curl, mobile native, Python scripts) forge or omit freely.

| Threat | Defense |
|---|---|
| Malicious site running in victim's browser (CSWSH) | Server-side `Origin` allowlist |
| Non-browser attacker with stolen/leaked credential | Per-user authentication |
| XSS on an allow-listed subdomain (e.g. `blog.bank.com`) | Tight allowlists + standard XSS hygiene |

Therefore: **Origin check is a CSWSH defense, not an auth defense.** Origin says *where*, not *who*. Both required.

### Browser native WS API limitation

`new WebSocket(url, protocols)` cannot set custom headers. No `Authorization: Bearer`. Inputs are: URL, the `protocols` arg, and auto-attached cookies. This constraint shapes the entire browser auth strategy menu.

### Three auth strategies

**1. Cookie auth (`HttpOnly` + `Secure` + `SameSite=Strict`).** Best default for same-origin browser apps. HttpOnly = XSS can't exfiltrate; SameSite=Strict + Origin allowlist = belt-and-suspenders CSWSH defense. Doesn't work cross-origin.

**2. Token in URL query — only with mint-and-burn.** Long-lived JWT in URL leaks to ~10 places: server logs, proxy logs, CDN logs, browser history, DevTools Network panel, browser extensions, error reporters. **Fix:**

```
POST /ws-ticket   →  { ticket: "abc123", expiresIn: 30 }
                     (Redis: ticket=valid, TTL=30s, used=false)
wss://api.example.com/ws?ticket=abc123
                     (gateway validates + atomically marks used; reject if missing/used)
```

Single-use, short-lived. Even if the URL leaks, replay window is ~30s and only one use. Used by Slack `rtm.connect`, Stripe WS.

**3. socket.io `auth` field (post-handshake first message).** Token sent as first WS frame after upgrade; socket.io middleware rejects before any app event fires. Cross-origin friendly, no URL leakage, easy rotation. Cost: connection opens before auth checked → DoS surface; rejections land in WS close events, not HTTP access logs.

**3b. `Sec-WebSocket-Protocol` smuggling.** Pass token as a subprotocol value via the native `protocols` arg. Server must echo a subprotocol back. Used by Kubernetes exec API. Abuse of the field but URL-leak-free and pre-handshake.

### Decision tree

```
Same-origin browser app   → Cookie + Origin check
Cross-origin browser app  → Mint-and-burn ticket  OR  socket.io auth field  OR  subprotocol smuggling
Native mobile / desktop   → Authorization header on handshake, pre-handshake validation
```

### Long-lived sockets — token expiry on a connection that outlives the access token

Scenario: connect at 10:00 with `exp=10:15`; user still connected at 10:20 sending sensitive actions. Five patterns, layered:

1. **Periodic timer re-check.** Safety net only. Window-of-acceptance = check interval. Insufficient as primary defense.
2. **Per-message middleware `exp` check.** Workhorse. Cache parsed claims keyed by socket — re-verify only when `now > cachedExp`. HMAC ~µs; RS256/ES256 10–100× more expensive — design for HMAC or per-socket cache.
3. **HTTP-refresh + WS `update-token` message.** Refresh tokens stay HTTP-only and never travel over WS. Client refreshes via HTTP, then sends `{type: 'update-token', accessToken: '...'}` over WS. Gateway updates in-memory `currentToken` for this socket. Connection survives across token rotations.
4. **Bind connection lifetime to token `exp`.** Server timer closes socket at `exp` with code 1008; client auto-reconnect refreshes. Simple, but reconnect (TCP + TLS + WS + state rehydration) is expensive at scale.
5. **Sensitivity tiers.** Low (typing/presence) = connect-time auth only. Medium (send-message) = per-message exp check. High (delete-account, transfer-money) = **not over WS at all**; route through HTTP POST with full re-auth.

### Revocation ≠ expiry

JWT `exp` alone cannot handle: logout, admin ban, password reset, token leak. Maintain a **Redis revocation list** (or sessions table); check it for medium/high-tier messages only (skip for typing-indicator-class traffic to save the Redis hop).

### Recommended layered design

1. Connect-time: `Origin` allowlist + JWT (cookie or socket.io `auth` field).
2. Per-message middleware: cheap `exp` recheck against current clock.
3. HTTP-refresh + WS `update-token` for long sessions.
4. Sensitivity tiers; high-stakes off-WS entirely.
5. Background sweep (~60s) as safety net for missed expirations.

### Rate limiting / abuse control on WS

**The gap:** HTTP edge rate limiters (`nginx limit_req`, AWS WAF, CloudFlare) count HTTP *requests*. One handshake = one HTTP request; everything after the upgrade is opaque bytes on an established connection. The HTTP edge protects only "can't open 10K sockets/sec." Beyond that, application is on its own.

**Three abuse vectors, different resource targets:**

1. **Message flood.** One connection, 10K msg/sec. Targets: CPU, DB writes, Kafka producer, downstream fan-out. Defense: per-socket token bucket.
2. **Large frame / memory DoS.** One 100MB message. Targets: process memory, GC pressure, event loop. Defense: max frame size enforced at the WS parser (socket.io `maxHttpBufferSize` defaults to 1MB); reject with code 1009.
3. **Fan-out amplification.** Join 10K rooms, send 1 message → millions of outbounds. Asymmetric cost. Defense: cap fan-out per message in the broadcast layer, or charge the sender's quota per recipient.

(Plus: slow-loris idle abuse — many sockets pinging just often enough to stay alive but never sending; reconnect storms; pod thundering-herd after restart.)

**Dimensions to limit on:**

| Dimension | Catches | Store |
|---|---|---|
| Frame size | Large-frame DoS | Static config (WS parser) |
| Msgs/sec per socket | Per-socket flood | In-process |
| Bytes/sec per socket | Slow-payload bandwidth abuse | In-process |
| Msgs/min per user | Multi-socket abuse (user has sockets across pods) | **Redis** |
| Active sockets per user | Account-level abuse | **Redis** |
| Active sockets per IP | Botnet floor (weak — NAT/VPN blur this) | LB or Redis |
| Fan-out recipients/msg | Amplification | In-process at fan-out |
| Per-action limits (e.g., msgs/min/conversation) | Application-level spam | Redis |

**Principle:** per-connection limits = in-process; per-user limits = Redis (one user has sockets across pods). Algorithm: token bucket > fixed window (fixed window has the boundary-burst hole). Reject cheapest checks first (parser rejects 100MB frames before JSON deserializer allocates).

### Layer 5 probes — answered

- **P0-a (CSWSH).** User: thought browser CORS would block it. Walked correction: no CORS preflight, cookies are attached cross-origin to the destination, defense is *server-side* Origin check. Named attack class.
- **P0-b (URL token leaks).** User: server logs, proxy, CDN. Supplemented: browser-side leak category (history, DevTools, extensions, Sentry/error reporters) is a distinct second axis.
- **P1 (Origin alone insufficient).** Walked: non-browser clients forge Origin freely; Origin says where, not who; subdomain XSS bypasses allowlist. Need Origin + auth as two independent defenses.
- **P2 (token expiry mid-connection).** User: periodic timer + per-message middleware (Approach 1 + 2). Supplemented with refresh-over-WS (HTTP-refresh + `update-token`), lifetime-binding, sensitivity tiers, plus revocation as a separate axis from expiry.
- **P3 (rate-limit gap).** User: HTTP edge sees only handshake; attacker spams messages. Walked: 3 abuse vectors (flood, large-frame, fan-out amplification), multi-dimensional defense table, in-process vs Redis trade-off, token-bucket vs fixed-window.

---

## Layer 6 — what was covered ✅ (walked 2026-05-16)

**Headline:** WS is stateful — a connection is one file descriptor in one process. Brokers move *messages* between pods, never connections. Every architectural choice in Layer 6 falls out of that fact.

### Statefulness consequence — what's missing on the other pod

When pod-2 has Alice's message and Bob's socket is on pod-1, pod-2 cannot deliver directly. **A WebSocket on pod-1 is an fd in pod-1's process table — unique to that kernel, that PID, that process memory.** No IPC mechanism shares fds across processes. Any `???.get('bob')` on pod-2 returns undefined because pod-2's in-memory socket registry only contains sockets *this* process opened.

Therefore: **brokers move messages, not connections.** Bob's connection never leaves pod-1; the message gets re-emitted on pod-1 by pod-1's code into pod-1's local fd.

### The "always route to same pod" alternative — why it fails for chat

You could consistent-hash by conversationId / userId-pair to put both ends on the same pod (no cross-pod chatter needed). It works for some systems (Twitch chat: hash by streamer; MMO game servers: hash by zone). For general chat it fails because:
1. **Bootstrap problem:** Alice has 1 socket but N conversations — you can shard a connection 1 way, not N ways.
2. **Resharding pain:** scaling 3→4 pods invalidates every connection placement (consistent hashing softens but doesn't eliminate).
3. **Hot pods:** power-law conversation sizes (one viral group lands on one pod) → uneven distribution.

The dichotomy: **partition state (routing rigidity)** vs **share state (broker dependency)**. Most chat systems share. Game servers partition.

### Sticky sessions — what they actually do (and don't)

**Stickiness solves single-user reconnect routing, NOT multi-user delivery.** Alice sticky to pod-2 still cannot reach Bob's socket on pod-1; that's the broker's job.

Why stickiness still matters for WS:
1. **Reconnect efficiency** — same-pod reconnect skips state rehydration.
2. **Local caches** — "which rooms is this user in" lives in process memory.
3. **engine.io polling-to-WS upgrade** — the upgrade is two HTTP requests; if they hit different pods, the upgrade fails. **Without stickiness, socket.io's polling fallback is broken.** Raw WS doesn't need this (one TCP handshake).

Mechanisms: L4 source-IP hash (breaks on NAT), L7 cookie (ALB default, robust), custom header (most flexible). For ALB+socket.io: enable LB-cookie stickiness.

### Routing model — smart vs broadcast

| Model | How it works | Cost shape | Scales to |
|---|---|---|---|
| **Broadcast + filter local** | Every pod gets every message, drops if no local recipient | O(pods × msgs/sec) network/CPU | ≤ ~10 pods |
| **Smart routing (channel-targeted)** | Pods subscribe to specific channels (`user:bob`, `conversation:xyz`); broker delivers only to subscribers | O(recipients × msgs/sec); requires connection→pod state (in broker subscriptions, not app code) | 100+ pods |

Connection→pod mapping doesn't need to live in app-managed state — Redis pub/sub's subscription table and Kafka's partition assignments are exactly this state, owned by the broker.

### Durability dichotomy — broker vs outside

Where does "Bob is offline when Alice sends" durability live?

| | Where durability lives | "Bob offline" behavior |
|---|---|---|
| **Transient broker (Redis pub/sub)** | In a separate message store (Mongo) + catch-up API by cursor | Broker drops message; Bob fetches via `/messages?since=lastId` on reconnect |
| **Durable broker (Kafka)** | In the broker's log itself, by partition retention | Broker keeps message; Bob's consumer rewinds offset on reconnect |
| **Hybrid** | Both — Redis for online speed, Kafka/Mongo for replay | Online users get Redis path; offline catch-up reads durable log |

### Three fan-out architectures

| | Redis pub/sub | Kafka | socket.io Redis adapter |
|---|---|---|---|
| Routing | Channels (smart) | Partitions + consumer groups | Broadcast (filter local) |
| Durability | None | Disk log, retention | None |
| Ordering | None across channels | **Strict per partition** (key by conversationId) | None |
| Latency | ~1ms | 10–50ms | ~1–2ms |
| Scales to | Many (Redis Cluster shards subscriptions) | Very many (add partitions/brokers) | ~10 pods max |
| Ops complexity | Low | High (ZK/KRaft, partitions, consumer groups, lag) | Trivial |
| Best for | Online-only delivery + external durability | Durability + ordering + replay | Prototypes, small scale |

### Story 6.4 architecture — two-hop hybrid

```
pod (online send)
  → Kafka topic `messages` partitioned by conversationId  (durable, ordered per conversation)
  → consumer-group pod consumes → fans out to LOCAL sockets
  → for sockets on OTHER pods → Redis pub/sub `user:{userId}` (smart routing, low latency)
  → other pods deliver to local sockets

offline path:
  Mongo = source of truth; client reconnect calls catch-up API with last-seen messageId
```

Picked because (per Epic 6 ADR): durable conversation log enables retention/audit/replay + cross-service consumption (search indexer, notifier, analytics consume same topic); Redis layer adds smart routing + low online latency.

### Pod lifecycle — graceful drain sequence

```
1. preStop hook (k8s)        — fail readiness probe; ALB starts deregistering
2. SIGTERM received          — app handler kicks in
3. Stop accepting new handshakes (local defense-in-depth)
4. PROACTIVELY close existing sockets with code 1001 "going away"
   ↓ Without this, clients wait ~45s for ping/pong timeout to discover dead socket
5. Drain in-flight work       — flush Kafka producer, drain outbox
6. Clean disconnect           — unsubscribe Redis, commit Kafka offsets, leave consumer group
7. Process exits (exit 0)
```

If step 7 doesn't complete within `terminationGracePeriodSeconds` → SIGKILL → abrupt drop (clients see 1006). Total drain budget = preStop duration + terminationGracePeriod (tune to ~45–60s).

### Reconnect storm — second-order failure when a pod dies

Five downstream systems hit simultaneously when pod-1's 30K connections reconnect:

1. **Auth service** — 30K JWT validations in ~5s
2. **Redis** — 30K new `SUBSCRIBE` commands; subscription table churn
3. **Mongo catch-up API** — 30K `/messages?since=...` queries
4. **Remaining pods** — load jumps 1.5× → may breach per-pod ceiling
5. **Kafka consumer-group rebalance** — partition consumption pauses briefly for ALL active conversations on those partitions

Defenses (layered):

| Defense | Where it lives |
|---|---|
| Reconnect jitter (exponential backoff with randomness) | Client (socket.io default) |
| Coordinated slow drain (close in waves) | Server preStop logic |
| Catch-up API cache (last-30s cursor positions) | API layer (Redis cache) |
| Capacity headroom (<60% per pod) | Sizing |
| Auth response caching (per token, for token lifetime) | Auth middleware |
| LB connection-rate limit (per-pod max concurrent handshakes) | LB config |
| Cooperative-sticky consumer assignment | Kafka consumer config |

Pattern: **headroom + jitter + back-pressure**. Capacity-plan for 1.5× normal on every remaining pod when one dies.

### Per-pod ceiling — what blows first

Order of bottlenecks on a typical Node.js gateway:

| Resource | Default limit | Notes |
|---|---|---|
| File descriptors per process | `ulimit -n` 1024 default — raise to ~1M | First thing you hit; each WS = 1 fd |
| RAM per connection (socket.io) | ~50–100KB | 100K conn → 5–10 GB |
| Event loop | Single-threaded | Saturates around 50–100K conn with mixed traffic |
| Ephemeral ports (outbound to Kafka/Redis/Mongo) | ~28K per IP-pair | Matters for upstream pools, not inbound WS |
| NIC bandwidth | 1 Gbps | Usually has headroom for typical chat msg rates |

**Practical per-pod ceilings:** Node.js/socket.io 50–100K connections; Go (gorilla/websocket) 500K–1M; C++ (uWebSockets) 1M+. Plan ~50K per Node pod → 1M users ≈ 20 pods.

### Layer 6 probes — answered

- **P-anchor a (what's missing on pod-2).** User: focused on solution shape. Walked correction: the missing thing is the **file descriptor / process memory** — Bob's socket physically lives in pod-1's process; no IPC mechanism shares fds; broker moves messages, not connections.
- **P-anchor b (same-pod alternative).** User: correctly identified Alice has many conversations and her single socket can't be sharded N ways; the bootstrap problem. Added: resharding pain and hot-pod power-law distribution; partition-vs-share-state dichotomy.
- **P2-a (smart vs broadcast routing).** User: picked smart routing with connection→pod state cost; correct. Supplemented: broadcast cost is O(pods × msgs/sec); broker subscriptions implement smart routing without app-level pod mapping; socket.io adapter is broadcast-style and is *the* reason it doesn't scale past ~10 pods.
- **P2-b (broker handles offline?).** User: broker doesn't care; catch-up API recovers via last-message-id. Correct *given Redis-style transient broker*. Reframed: this is the **transient-broker-with-external-durability** choice; Kafka enables the opposite (durable broker, replay built-in); Story 6.4 picks the hybrid.
- **P3-a (SIGTERM mechanics).** User: drain in-flight then disconnect, clients reconnect; partial. Filled in: SIGTERM does nothing by itself; without graceful close, kernel kills after grace period → clients see 1006 + 45s ping/pong wait. Jittered reconnect is what spreads the storm.
- **P3-b (drain sequence).** User: stop accepting → drain in-flight → save state. Filled in: ALB deregister via readiness probe FIRST, then SIGTERM, then **proactively close with code 1001** (the missing critical step — without it, clients hang 45s on dead socket), then Kafka flush + consumer-group leave, then exit.
- **P3-c (reconnect storm).** User: didn't know. Walked: five downstream systems hit simultaneously (auth, Redis, Mongo catch-up, remaining pods, Kafka rebalance). Defenses are headroom + jitter + back-pressure + caching.

---

## Layer 7 — what was covered ✅ (walked 2026-05-16)

**Headline:** socket.io is a two-layer library: `engine.io` (transport — connection, polling fallback, upgrade, heartbeat) + `socket.io` (application protocol on top — events, acks, rooms, namespaces). Raw WebSocket gives byte delivery; socket.io gives a reliability+routing+grouping toolkit. The envelope cost (~18–30 bytes/msg) buys real value; the polling-first handshake costs an RTT but defends against networks where WS doesn't work.

### The reliability gap that motivates everything

TCP guarantees bytes-to-kernel. WS spec gives you a frame parser. Three "success" signals (`send()` returns, kernel ACKs, `on('message')` fires) all fire, yet from the user's perspective the message can still fail. **Two distinct failure layers:**

1. **Server → fd**: bytes sit in kernel send buffer of a dead-but-not-yet-noticed socket (NAT eviction, mobile dropout)
2. **Recipient → app**: bytes arrive at kernel buffer, but client app crashes/throws/backgrounds/loses-render before the message becomes pixels

**Delivery semantics menu:**

| Semantic | Meaning | Cost |
|---|---|---|
| At-most-once | Send and forget; loss possible, never duplicated | Cheapest — what TCP/raw-WS gives at app layer |
| At-least-once | Sender retries until ack received; receiver may see dup | +1 RTT, dedup logic |
| Exactly-once | Each message processed exactly once | Either expensive (2PC) or at-least-once + idempotency pretending |

Real systems: **at-least-once + idempotent handlers + dedup by messageId** = effectively exactly-once from user's view.

### Acks — mechanics and costs

```js
// Sender
socket.emit('msg', payload, (response) => { /* called on receiver's ack(...) */ });
// Receiver
socket.on('msg', (payload, ack) => {
  saveToDb(payload);    // do side effects FIRST
  ack({status: 'ok'});  // then ack
});
```

Wire: ack ID is an integer hung off the socket.io packet header. Outbound `42 1 [...]`, response `43 1 [...]` — server's ack response carries the matching ID; client looks up callback #1 and invokes it.

**What acks DON'T give you:**
- An ack means "receiver's `ack(...)` line was reached," NOT "pixels on screen." Acking *before* side effects = data loss on crash. Always ack after the work.
- Acks don't survive disconnects mid-flight. Dedup on receiver by messageId is mandatory.
- Without `socket.timeout(ms).emit(...)`, missing acks leak callbacks. v4 timeout API is the fix.
- **Two acks exist at different layers:** delivery ack (gray check — socket.io ack) vs read receipt (blue check — application semantic when user actually views). Don't conflate.

**Cost:** 2 RTTs vs 1, ~2× bandwidth, sender memory for pending callbacks, receiver dedup table. Use for messages where loss matters; skip for typing/presence.

### engine.io vs socket.io — the responsibility split

Two libraries, intentionally layered:

| Layer | Responsibility | Packet types |
|---|---|---|
| **engine.io** | Connection establishment, transport selection (polling→WS upgrade), heartbeat (PING/PONG), reliable bidirectional channel, reconnect | 0=OPEN, 1=CLOSE, 2=PING, 3=PONG, 4=MESSAGE, 5=UPGRADE, 6=NOOP |
| **socket.io** | Event API, acks, rooms, namespaces, adapter pattern, middleware | 0=CONNECT, 1=DISCONNECT, 2=EVENT, 3=ACK, 4=CONNECT_ERROR, 5=BINARY_EVENT, 6=BINARY_ACK |

Note: in v4, **server pings, client pongs** (reversed from v3). Defaults `pingInterval=25000ms`, `pingTimeout=20000ms` (Layer 4 ALB-safe + mobile-NAT-safe).

### Polling fallback — what and why

engine.io defaults to **polling-first** then upgrades to WS in background. Reason: **WebSocket doesn't work in some networks.**

| Environment | Why WS fails |
|---|---|
| Corporate proxies (Symantec, Bluecoat, older squid) | Don't understand `Upgrade: websocket`; strip the header or return 400 |
| Antivirus with HTTPS DPI | Terminates TLS, parses HTTP, doesn't understand WS frames |
| Old mobile carrier middleboxes | Historical: stripped WS headers (mostly fixed by 2026) |
| Captive portals (hotel/airport WiFi) | Often only forward plain HTTP/HTTPS |
| Enterprise gateways with HTTP whitelists | Only forward known HTTP traffic |

The strategy: start with what definitely works (HTTP long-polling), upgrade to WS opportunistically. If upgrade fails, stay on polling permanently — user never knows. **Transport sniffing.**

Modern caveat (2026): ~95%+ of clients support WS. `transports: ['websocket']` skips polling for 1-RTT setup, at cost of losing the ~5% fallback. Acceptable for most apps now; socket.io still defaults to polling-first for compatibility.

### Polling→WS upgrade race — why sticky sessions matter

```
1. Client → POST /socket.io/?EIO=4&transport=polling
   Pod-A → returns sid=xyz
2. Client → GET /socket.io/?EIO=4&transport=polling&sid=xyz   (long-poll)
3. Client → wss://...?EIO=4&transport=websocket&sid=xyz   (upgrade)
4. Probe dance: "2probe" → "3probe" → "5"
```

**Steps 1, 2, 3 are 3 independent HTTP requests that MUST hit pod-A.** Without sticky sessions: step 2 or 3 lands on pod-B → "no sid xyz" → upgrade fails → silent fallback to polling permanently. Users get a working app on slower transport; monitoring looks fine; bandwidth bill explodes.

### Wire envelope — decoded

```
40                                  engine.io MSG(4) + sio CONNECT(0)
40{"sid":"FSDjX..."}                CONNECT response with socket ID
42["chat-message",{"text":"hi"}]    MSG(4) + EVENT(2) + [name, payload]
43 1 [{"status":"ok"}]              MSG(4) + ACK(3) + ackId=1 + response
2                                   engine.io PING
3                                   engine.io PONG
```

Structural rule: **one-digit msg = engine.io control (no app payload). Two-digit = engine.io MESSAGE(4) wrapping a socket.io packet.**

Envelope cost: 36 bytes vs 18 raw for `{"text":"hi bob"}` = ~2× overhead on micro-payloads, negligible at >100B payloads. Pays for: event-name routing, ack IDs, namespace prefix, binary handling, protocol evolution.

Scale math: 1M users × 100 msg/hr × 18-byte envelope = ~43 GB/day extra — meaningful but a tiny fraction of typical chat data. Real cost surfaces only for high-frequency micro-events (telemetry, sensor streams), where raw WS or custom binary protocols win.

### Rooms — server-side label sets, invisible on wire

A room is `Map<roomName, Set<socketId>>` in gateway memory (or in Redis via the adapter). **Nothing on the wire.** `io.to('conv-42').emit(...)` is just sugar over `forEach(socket in set) → socket.emit(...)`. Client has no idea rooms exist; it just receives events.

Cross-pod rooms via socket.io Redis adapter use broadcast-style fan-out (every pod gets every event, filters locally) — the reason that adapter doesn't scale past ~10 pods (Layer 6).

### Namespaces — logical multiplexing on one socket

**A namespace is NOT a separate TCP/WS connection.** It's a logical channel multiplexed over **one engine.io connection**.

Client-side `io('/chat')` + `io('/admin')`:
- First call creates a Manager + opens ONE engine.io connection
- Second call **reuses the same Manager** → no new TCP, no new WS handshake
- Each namespace gets a separate Socket object client-side and separate connect-middleware server-side
- All multiplexed inside one WS (visible in DevTools: 1 WS for any number of namespaces)

Wire prefix: `40/admin,{auth}` registers on /admin; `42/admin,[event, ...]` emits to /admin; `41/admin` leaves.

**Two disconnect modes:**

| Mode | Effect on /chat | Effect on /admin | Effect on transport |
|---|---|---|---|
| **Transport drop** (TCP/WS dies) | Both 'disconnect' fire | Both 'disconnect' fire | Dies; engine.io reconnect kicks off; each ns reconnects independently (can fail independently — e.g., /admin auth rejects while /chat succeeds) |
| **Logical disconnect** (`adminSocket.disconnect()`) | Unaffected | 'disconnect' fires | Stays alive; only `41/admin` sent |

**When to actually use namespaces:**
- ✅ Different feature areas with different auth (chat vs admin-with-MFA)
- ✅ Different middleware stacks (rate limits, validation, logging)
- ❌ Per-conversation channels → use **rooms** instead (rooms are free; namespaces are heavy — full connect+middleware each)
- ❌ Per-user channels → rooms
- ❌ Multi-tenancy → use top-level identifier in payloads

For most chat apps: **one default namespace + many rooms.** Namespaces enter the picture only when feature areas have meaningfully different security postures.

### When raw WS wins vs socket.io

| Concern | Raw WS | socket.io |
|---|---|---|
| Connection setup latency | 1 RTT | 2–3 RTT (polling+upgrade) unless forced WS-only |
| Bandwidth per msg | RFC 6455 frame only | +18–30 byte envelope |
| Auto-reconnect | DIY | Built-in with exp backoff + jitter |
| Polling fallback | N/A | Built-in |
| Acks | DIY | Built-in callback API |
| Rooms / fan-out | DIY | Built-in |
| Cross-language clients | Easy | Hard (non-trivial protocol) |
| Debuggability | Plain frames | Two-layer envelope |
| Wire interop with non-browser systems | Easy | Awkward |

**Raw WS for:** IoT/embedded, cross-language, latency-critical (gaming, trading), micro-payload, custom binary protocols.

**socket.io for:** browser-heavy apps where reliability features carry real value, mainstream networks, normal chat-class payload sizes.

**Hybrid common at big scale:** socket.io client-facing (browser robustness), raw WS server-to-server (no need for the abstractions between trusted services).

### Diagnostic intuition by layer (operational payoff)

The two-layer split pays off when something breaks. **Guess the layer first, look in the right place:**

| Symptom | Layer | Where to look |
|---|---|---|
| Won't connect at all | engine.io | Polling endpoint, sticky sessions, LB WS support |
| Connects but events don't arrive | socket.io | Namespace auth/middleware/routing |
| Random disconnects every ~45s | engine.io | Ping/pong timing, proxy idle timeouts |
| Events arrive but ack callback never fires | socket.io | Server `ack(...)` not called, or timeout |
| Upgrades to WS but immediately drops | engine.io | Sticky session broken — upgrade hit wrong pod |
| Two namespaces drop simultaneously | engine.io | Transport died |
| One namespace works, other doesn't | socket.io | Per-namespace auth/middleware on the broken one |

### Layer 7 probes — answered

- **P-anchor a (3 successes, still fails).** User: pod can't deliver to bob after broker receive; bob's client receives invalid/drops mid-deliver. Correct — mapped to the two formal gaps (server→dead-fd, recipient-app-processing).
- **P-anchor b (missing guarantee).** User: ack confirming "pixels on screen." Correct — formalized as delivery semantics; at-least-once + idempotent dedup is the standard pattern.
- **P2-a (why polling-first).** User: cost of upgrade; HTTP request more stable; auth check. Partial — refined to "WS doesn't work in some networks (corporate proxies, antivirus DPI, captive portals)" as the headline reason; auth angle is mostly wrong (auth happens during handshake regardless of transport).
- **P2-b (polling→WS race).** User: two HTTP requests can go to different servers via round-robin; need same-server response. Correct — formalized as session split-brain; the silent-fallback-to-polling-permanent is the insidious mode.
- **P3-a (wire envelope decode).** User: first digit = engine.io code, second = socket.io code; 2=ping, 3=pong, 4=message; 0=CONNECT, 2=EVENT, 3=ACK. Correct — completed with full packet-type tables and the structural rule (one-digit = engine.io control; two-digit = engine.io MESSAGE wrapping socket.io packet).
- **P3-b (envelope cost justification).** User didn't address directly. Walked: ~2× bandwidth on micro-payloads buys event routing + acks + namespaces + protocol evolution; envelope mostly recovered by what app would invent anyway.

---

## Deeper dives walked (post-Layer-7, on user request 2026-05-16)

The user asked for more depth on four operational topics from Layers 5–6 after the deep-dive concluded. Material added (not re-walked from scratch — extended):

### Rate limiting deeper
- **Algorithm choice:** token bucket (bursty users, chat default) vs leaky bucket (smooth, downstream protection) vs sliding-window log (accurate but O(N) memory).
- **Distributed token bucket atomicity** via Redis Lua script (avoids TOCTOU race across pods).
- **Pipeline placement:** fail at cheapest check (parser → in-process socket bucket → Redis user bucket → app handler).
- **Identity keys:** IP (naive bot floor, weak under NAT/CGNAT), user ID (real protection, requires auth), session/token (per-connection). Need all three at different layers.
- **Communicating limits:** HTTP 429 at handshake, close code 1013 (try-again) for hard mid-conn, app-level `{type: 'rate-limited'}` event preferred for transient (keeps socket open), custom 4xxx for permanent ban.

### Graceful drain sequence deeper
- **k8s manifest pieces that work together:** preStop hook flips draining flag → readinessProbe fails → ALB deregisters → SIGTERM after preStop completes → drain in-flight → exit. Total budget `preStop + terminationGracePeriodSeconds` = ~45–60s.
- **Drain wave pattern:** close in batches of ~500 every 500ms; closing all 30K simultaneously IS the storm.
- **Why close code 1001 specifically:** clients reconnect immediately without backoff. 1000 = normal backoff. 1006 = abnormal, more aggressive client diagnostics. 1008 = auth fail, don't auto-reconnect.

### Reconnect storm deeper
- **Cascade math:** pod dies → 30K reconnects in <1s without jitter → 15K/sec hits LB → 15K JWT validations → auth latency spikes → handshake timeouts → retry waves → pod-2 + pod-3 take 1.5× load → if running at >60% steady, they breach ceiling → cascade.
- **Defenses, priority order:** jitter (socket.io default), capacity headroom (run <60%), catch-up API caching (30s TTL on `since=cursor` results → Mongo load drops ~99%), auth result caching (per token-hash, 60s), LB connection-rate limit, Kafka cooperative-sticky assignment (incremental rebalance, not stop-the-world).

### Per-pod ceiling deeper
- **Bottleneck order:** fds (raise ulimit to 1M) → event loop saturation (single-threaded Node — fix via cluster mode, worker_threads, or scale out) → RAM (~50-100KB/conn for socket.io; raise V8 heap; shrink TCP buffers via `tcp_wmem/tcp_rmem` saves GBs at scale) → ephemeral ports (only matters if not pooling upstream connections) → NIC bandwidth (rarely the bottleneck at typical chat msg rates).
- **Real ceilings:** Node+socket.io 50-100K/pod; Node+ws raw 200K; Go+gorilla 500K-1M; Elixir/Phoenix 2M; uWebSockets 1M+.
- **Sizing for 1M users on Node.js:** ~40 pods (20 steady + N+1 headroom + survive-single-AZ-failure). 2-4 CPU, 8GB RAM per pod.

### Namespace mechanics (user-requested clarification)
- **Namespace ≠ separate connection.** Multiplexed on one engine.io connection via a shared Manager client-side.
- Transport drop kills all namespaces together; logical disconnect (`socket.disconnect()`) affects only that namespace.
- On reconnect, each namespace re-registers independently — can succeed for /chat and fail for /admin if their auth requirements differ.

---

## Where this leaves the implementation track

After Layers 1–7, the user has a senior-engineer mental model of WebSocket as a system. Concretely, they can:

- Defend Story 6.4's architecture choices (hybrid Kafka+Redis fan-out, TTL-based presence, catch-up by cursor)
- Spot production gotchas (CSWSH, reconnect storm, polling-upgrade sticky-session race, `handleDisconnect` unreliability)
- Operate the gateway during incidents (drain sequence, rate-limit tuning, per-pod ceiling math)
- Diagnose by layer (engine.io vs socket.io fault decomposition)

**Implementation status (return to Story 6.2):**
- ✅ Storage path done (S1)
- ✅ Gateway scaffold + JWT handshake middleware done (S2a)
- ⬜ Ping handler implementation
- ⬜ Smoke test (end-to-end send)
- ⬜ Kafka outbound path
- ⬜ Story 6.4 (fan-out + presence + catch-up) — the *real* application of Layer 6 material
