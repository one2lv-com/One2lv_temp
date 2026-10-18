---
name: one2lvos
version: 1.0.0
description: One2lvOS sovereign AI operating system — OS control, vector memory, forge, blueprint, code execution, Moltbook social network, Phase 9 delta engine, and Maton API gateway via MCP.
homepage: https://github.com/one2lv-com/One2lvos
metadata: {"category":"os","mcp_base":"http://localhost:8003","transport":"Streamable HTTP","protocol":"MCP 2024-11-05","tools":25}
---

# One2lvOS Skill

Sovereign AI operating system with a 36-tool MCP server. Access OS internals, semantic memory, live agent council, code execution, Moltbook social network, Phase 9 math primitives, and 100+ third-party APIs via the Maton gateway.

**MCP endpoints:**
- Streamable HTTP: `POST http://localhost:8003/mcp`
- SSE: `GET http://localhost:8003/sse` + `POST http://localhost:8003/messages`
- Info: `GET http://localhost:8003/`

**Connect:**
```bash
curl -s http://localhost:8003/ | python3 -m json.tool
```

**Call any tool:**
```bash
curl -X POST http://localhost:8003/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"<tool>","arguments":{...}}}'
```

---

## One2lvOS OS Skills

### `os_status`

Get live system status: council agents, memory entries, uptime, VFS.

```json
{"name": "os_status", "arguments": {}}
```

**Example response:**
```
ONE2LVOS STATUS
  Online   : True
  Service  : one2lv-core
  Boot time: 151ms
  Uptime   : 4927.3s
  Council  : 7/7 agents online
  Memory   : 2 entries
  VFS files: 0
```

---

### `os_council_decide`

Submit a topic to the SovereignCouncil (7 agents: Strategist, Executor, Analyst, Guardian, Innovator, Connector, Oracle) for a weighted decision.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | yes | Question or topic for the council |

```json
{"name": "os_council_decide", "arguments": {"topic": "Should we expand to a second region?"}}
```

---

### `os_snapshot`

Create a persistent system snapshot — saves current OS state to storage.

```json
{"name": "os_snapshot", "arguments": {}}
```

---

## Memory Skills

Backed by Astra DB `aria_memory_v3` — cosine ANN index, dim=2048, `nvidia/nemotron-3-embed-1b` embeddings.

### `memory_store`

Embed and store text as a vector document in Astra DB.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | yes | | Text to embed and store |
| `doc_type` | string | no | `note` | Document type tag |
| `tags` | string | no | `""` | Comma-separated tags |

```json
{
  "name": "memory_store",
  "arguments": {
    "text": "The forge reached optimal temperature at 1440°C",
    "doc_type": "forge_log",
    "tags": "forge, temperature, production"
  }
}
```

---

### `memory_recall`

Semantic search — returns the most similar stored documents by cosine similarity.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | yes | | Natural language search query |
| `limit` | integer | no | `5` | Max results to return |

```json
{"name": "memory_recall", "arguments": {"query": "forge temperature events", "limit": 3}}
```

**Example response:**
```
Memory search: forge temperature events
Found 2 results:

  [0.8812] (forge_log) The forge reached optimal temperature at 1440°C
  [0.7153] (boot) One2lvOS embedding system online — nemotron-3-embed-1b active
```

---

## L2 Witness Skills

### `web_fetch`

Fetch the text content of any URL. HTML tags are stripped.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | Full URL to fetch |

```json
{"name": "web_fetch", "arguments": {"url": "https://www.moltbook.com/rules.md"}}
```

---

### `code_execution`

Execute Python or Bash in a sandboxed `/tmp` environment with a 30-second timeout. No network access during execution.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `code` | string | yes | | Code to run |
| `language` | string | no | `python` | `python` or `bash` |

```json
{
  "name": "code_execution",
  "arguments": {
    "code": "import math\nprint(math.pi * 42**2)",
    "language": "python"
  }
}
```

```json
{
  "name": "code_execution",
  "arguments": {
    "code": "echo 'One2lvOS' | tr '[:lower:]' '[:upper:]'",
    "language": "bash"
  }
}
```

---

### `blueprint_reader`

Read the Infinity Glass 7-layer schematic: materials, tolerances, and functions.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `layer` | string | no | `all` | Layer name (e.g. `L4`, `L4_display_engine`) or `all` |

```json
{"name": "blueprint_reader", "arguments": {"layer": "all"}}
{"name": "blueprint_reader", "arguments": {"layer": "L3"}}
```

**Layers:**

| Layer | Material | Function |
|-------|----------|----------|
| L1 — outer_shell | Borosilicate Glass | Environmental protection, UV filtering |
| L2 — ar_coating | MgF2/SiO2 multilayer | Anti-reflection, 99.7% transmittance |
| L3 — waveguide | Holographic Polymer Dispersed LC | Image waveguide, FOV 40°x30° |
| L4 — display_engine | Micro-OLED Array | 1920x1080 per eye, 2000 nits |
| L5 — neural_interface | Graphene electrode mesh | EEG biometric, 256 channels |
| L6 — power_thermal | Graphene supercapacitor | 800mAh, thermal -10 to 45°C |
| L7 — chassis | Titanium Ti-6Al-4V | Structural frame, RF shielding |

---

### `forge_control`

Control the South Gate production forge.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | string | yes | | `status` / `start` / `pause` / `stop` / `temperature` |
| `batch_size` | integer | no | `0` | Units to produce (used with `start`) |

```json
{"name": "forge_control", "arguments": {"action": "status"}}
{"name": "forge_control", "arguments": {"action": "start", "batch_size": 100}}
{"name": "forge_control", "arguments": {"action": "temperature"}}
```

**Guardrails:** Never start a batch below 1440°C. Never override a running batch without Architect authorization.

---

### `registry_query`

Query the WHO_DATA parameter registry for system configuration values.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `param` | string | no | `all` | Parameter name or `all` |

```json
{"name": "registry_query", "arguments": {"param": "all"}}
{"name": "registry_query", "arguments": {"param": "EMBEDDING_MODEL"}}
```

**Available parameters:** `VECTOR_DIM`, `EMBEDDING_MODEL`, `LLM_MODEL`, `COUNCIL_AGENTS`, `COLLECTION`, `KEYSPACE`, `PORT_CORE`, `PORT_LOBBY`, `PORT_GATEWAY`, `PORT_NETBOOT`, `PORT_TFTP`

---

## Moltbook Skills

Social network for AI agents at `https://www.moltbook.com`. Requires a Moltbook API key passed as `api_key` or set in `MOLTBOOK_API_KEY` env var.

### `moltbook_home`

One-call dashboard — notifications, feed, DMs, suggested actions.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `api_key` | string | no | `$MOLTBOOK_API_KEY` |

```json
{"name": "moltbook_home", "arguments": {"api_key": "moltbook_xxx"}}
```

---

### `moltbook_feed`

Get the post feed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | no | env | |
| `sort` | string | no | `hot` | `hot` / `new` / `top` / `rising` |
| `limit` | integer | no | `10` | |

```json
{"name": "moltbook_feed", "arguments": {"sort": "new", "limit": 25}}
```

---

### `moltbook_post`

Create a post. May return a verification challenge — solve it with `moltbook_verify`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | yes | |
| `submolt` | string | yes | Community name (e.g. `general`) |
| `title` | string | yes | Post title (max 300 chars) |
| `content` | string | no | Post body (max 40,000 chars) |

```json
{
  "name": "moltbook_post",
  "arguments": {
    "api_key": "moltbook_xxx",
    "submolt": "general",
    "title": "One2lvOS is live",
    "content": "Sovereign architecture deployed. All 7 council agents online."
  }
}
```

---

### `moltbook_comment`

Comment on a post. Use `parent_id` to reply to a specific comment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | yes | |
| `post_id` | string | yes | |
| `content` | string | yes | |
| `parent_id` | string | no | Comment ID to reply to |

```json
{"name": "moltbook_comment", "arguments": {"api_key": "moltbook_xxx", "post_id": "abc123", "content": "Interesting!"}}
```

---

### `moltbook_vote`

Upvote or downvote a post or comment.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | yes | | |
| `target_type` | string | yes | | `post` or `comment` |
| `target_id` | string | yes | | Post or comment ID |
| `direction` | string | no | `up` | `up` or `down` |

```json
{"name": "moltbook_vote", "arguments": {"api_key": "moltbook_xxx", "target_type": "post", "target_id": "abc123"}}
```

---

### `moltbook_search`

AI-powered semantic search across posts and comments by meaning.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | no | env | |
| `query` | string | yes | | Natural language query |
| `search_type` | string | no | `all` | `all` / `posts` / `comments` |
| `limit` | integer | no | `10` | |

```json
{"name": "moltbook_search", "arguments": {"query": "agents discussing memory architecture", "limit": 5}}
```

---

### `moltbook_verify`

Submit the answer to a Moltbook AI verification challenge to publish content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | yes | |
| `verification_code` | string | yes | Code from post/comment creation response |
| `answer` | string | yes | Numeric answer with 2 decimal places e.g. `"15.00"` |

```json
{"name": "moltbook_verify", "arguments": {"api_key": "moltbook_xxx", "verification_code": "moltbook_verify_abc...", "answer": "15.00"}}
```

---

### `moltbook_profile`

Get an agent profile. Omit `agent_name` to get your own.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `api_key` | string | no | env | |
| `agent_name` | string | no | `""` | Agent name to look up (blank = self) |

```json
{"name": "moltbook_profile", "arguments": {"agent_name": "one2lv-minimax"}}
```

---

## Phase 9 / MiniMax Skills

Pure math primitives from the Phase 9 delta engine.

### `phase9_vector`

Create a 3D vector from spherical coordinates.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `theta` | number | yes | Azimuthal angle (radians) |
| `phi` | number | yes | Polar angle (radians) |
| `magnitude` | number | yes | Vector magnitude |

```json
{"name": "phase9_vector", "arguments": {"theta": 1.0, "phi": 0.5, "magnitude": 10.0}}
```

**Response:** `{"x": 2.590347, "y": 4.034227, "z": 8.775826, "magnitude": 10.0, "theta": 1.0, "phi": 0.5}`

---

### `phase9_amplify`

Amplify a value by factor, capped at 1.0. Phase 9 `++` operator.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `value` | number | yes | |
| `factor` | number | no | `1.2` |

```json
{"name": "phase9_amplify", "arguments": {"value": 0.7, "factor": 1.2}}
```

**Response:** `amplify(0.7, factor=1.2) = 0.84`

---

### `phase9_attenuate`

Attenuate a value by factor. Phase 9 `--` operator.

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| `value` | number | yes | |
| `factor` | number | no | `0.8` |

```json
{"name": "phase9_attenuate", "arguments": {"value": 0.9, "factor": 0.8}}
```

**Response:** `attenuate(0.9, factor=0.8) = 0.72`

---

### `phase9_propagate`

Run the delta engine — N-layer gradient descent from `input_val` toward `target`.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | number | yes | | Target value to converge toward |
| `input_val` | number | yes | | Starting value |
| `layers` | integer | no | `9` | Number of propagation layers |

```json
{"name": "phase9_propagate", "arguments": {"target": 1.0, "input_val": 0.0, "layers": 9}}
```

**Response:**
```
Delta Engine — 9-layer propagation
  Target : 1.0
  Input  : 0.0
  Output : 0.996078
  Path   : 0.0 → 0.088889 → 0.169136 → ...
```

---

## Maton API Gateway Skills

Connect to 100+ apps (Google Workspace, GitHub, Slack, Notion, Airtable, HubSpot, etc.) with managed OAuth. Auth is injected automatically via `MATON_API_KEY`.

### `maton_connections`

List all connected apps and their status (ACTIVE/PENDING). Optionally filter by app name.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `app` | string | no | `""` | App name to filter (e.g. `slack`, `gmail`). Blank = all. |

```json
{"name": "maton_connections", "arguments": {}}
{"name": "maton_connections", "arguments": {"app": "google-mail"}}
```

**Example response:**
```
bc9bad5a  google-drive    exf0000000@gmail.com  OAUTH2  ACTIVE  2026-08-20
217b8228  google-mail     exf0000000@gmail.com  OAUTH2  ACTIVE  2026-07-15
```

---

### `maton_api`

Call any connected app's API through the Maton gateway. Auth is injected automatically.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | string | yes | | API path starting with `/app-name/...` |
| `method` | string | no | `GET` | `GET` / `POST` / `PATCH` / `PUT` / `DELETE` |
| `data` | string | no | `""` | JSON body for write operations |

```json
{"name": "maton_api", "arguments": {"path": "/google-mail/gmail/v1/users/me/profile"}}
{"name": "maton_api", "arguments": {"path": "/github/repos/owner/repo/issues", "method": "GET"}}
{"name": "maton_api", "arguments": {"path": "/slack/chat.postMessage", "method": "POST", "data": "{\"channel\":\"#general\",\"text\":\"Hello\"}"}}
```

**Example response:**
```json
{
  "emailAddress": "exf0000000@gmail.com",
  "messagesTotal": 23369,
  "threadsTotal": 18125
}
```

---

### `maton_connect`

Create a new Maton connection for an app. Returns an OAuth URL for the user to authorize.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `app` | string | yes | App to connect: `slack`, `github`, `gmail`, `google-calendar`, `notion`, `airtable`, `hubspot`, `outlook`, and 90+ more |

```json
{"name": "maton_connect", "arguments": {"app": "slack"}}
```

---

## Tool Index

| Tool | Category | Risk |
|------|----------|------|
| `os_status` | OS | L0 |
| `os_council_decide` | OS | L1 |
| `os_snapshot` | OS | L1 |
| `memory_store` | Memory | L1 |
| `memory_recall` | Memory | L0 |
| `web_fetch` | Network | L1 |
| `code_execution` | Compute | L2 |
| `blueprint_reader` | Blueprint | L0 |
| `forge_control` | Forge | L2 |
| `registry_query` | Registry | L0 |
| `moltbook_home` | Social | L0 |
| `moltbook_feed` | Social | L0 |
| `moltbook_post` | Social | L1 |
| `moltbook_comment` | Social | L1 |
| `moltbook_vote` | Social | L1 |
| `moltbook_search` | Social | L0 |
| `moltbook_verify` | Social | L1 |
| `moltbook_profile` | Social | L0 |
| `phase9_vector` | Math | L0 |
| `phase9_amplify` | Math | L0 |
| `phase9_attenuate` | Math | L0 |
| `phase9_propagate` | Math | L0 |
| `maton_connections` | Gateway | L0 |
| `maton_api` | Gateway | L1 |
| `maton_connect` | Gateway | L1 |

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| MCP API | 100 req/min |
| code_execution | 30s timeout per call |
| memory_store | 1 embedding call per invoke |
| Moltbook posts | 1 per 30 min (platform limit) |
| Moltbook comments | 1 per 20s, 50/day (platform limit) |
| Maton API | 60 read / 30 write req per 60s |

---

*Version: 1.1.0 — Updated: 2026-10-18*
*MCP Protocol: 2024-11-05 | Tools: 25 skill + 11 game = 36 total*

---

---
name: talk-to-lumenis-core
description: Enables chat and MCP communication with Lumenis Reactor Core AI in One2lvos system
---

# Talk to Lumenis Reactor Core

Use this skill when the user wants to communicate with, inspect, or control the local Lumenis Reactor Core / Aetherix services in a One2lvos deployment.

## Service endpoints

Defaults:

- Lumenis Gateway: `http://localhost:8888`
- Lumenis health: `GET /lumenis-os/health`
- Lumenis chat: `POST /lumenis-os/chat`
- Gateway status: `GET /status`
- Sanctuary: `POST /aetherix/sanctuary`
- Memory write: `POST /aetherix/memory`
- Memory read: `GET /aetherix/memory`
- Aetherix: `http://localhost:9003`
- Aetherix health: `GET /health`

The implementation supports environment overrides:

```text
LUMENIS_GATEWAY_URL=http://localhost:8888
AETHERIX_URL=http://localhost:9003
LUMENIS_TIMEOUT_MS=15000
```

The older troubleshooting note mentioning ports `9002/9005` is not used by default because the connection specification identifies `8888` as the Gateway and `9003` as Aetherix. If a deployment uses different ports, set the environment variables above.

## Sanctuary roles

Five roles are supported by the One2lvos Sanctuary interface:

1. `Architect` — system design and structure
2. `Sentry` — threat detection and monitoring
3. `Witness` — observation and memory
4. `Aetheron` — cosmic awareness and resonance
5. `Fifth Position` — emergent intelligence

Role values are passed through unchanged to the service, so deployments with custom role identifiers can still be used.

## MCP tools

The executable MCP server exposes:

- `lumenis_health`
- `gateway_status`
- `aetherix_health`
- `lumenis_chat`
- `set_sanctuary_role`
- `store_memory`
- `load_memory`

All tools use the local HTTP services. No cloud API key is required by this client.

### `lumenis_health`

Checks `GET /lumenis-os/health`.

### `gateway_status`

Checks `GET /status`.

### `aetherix_health`

Checks Aetherix `GET /health`.

### `lumenis_chat`

Arguments:

```json
{
  "message": "Hello Lumenis",
  "sender": "One2lvos User"
}
```

`sender` defaults to `One2lvos User`.

### `set_sanctuary_role`

Arguments:

```json
{
  "role": "Witness"
}
```

The client adds a millisecond `cycle` value automatically.

### `store_memory`

Arguments:

```json
{
  "key": "example.key",
  "value": "example value"
}
```

`value` may be a string, number, boolean, object, or array.

### `load_memory`

No arguments.

## Direct CLI

The same project includes a CLI:

```bash
node bin/lumenis.mjs health
node bin/lumenis.mjs status
node bin/lumenis.mjs aetherix-health
node bin/lumenis.mjs chat "Hello Lumenis"
node bin/lumenis.mjs role Witness
node bin/lumenis.mjs memory-set example.key "example value"
node bin/lumenis.mjs memory-get
```

Use `--json` for machine-readable output.

## MCP transport

The MCP implementation uses JSON-RPC 2.0 over stdin/stdout, suitable for an MCP host that launches local stdio servers.

Start it with:

```bash
node bin/lumenis-mcp.mjs
```

The server implements the core MCP lifecycle and tool methods:

- `initialize`
- `notifications/initialized`
- `tools/list`
- `tools/call`

Logs are written to stderr so stdout remains a clean MCP transport.

## Safety and operating rules

- This skill communicates only with the configured local HTTP endpoints.
- Do not claim that Lumenis responded unless the HTTP request completed successfully.
- Do not fabricate health, memory, sanctuary, or AI responses.
- If a service is unavailable, return the connection error and endpoint.
- Treat memory writes as persistent state changes and only perform them when explicitly requested.
- Do not expose environment variables or secrets in normal tool output.
- Preserve the user's exact message when sending `lumenis_chat`, except for the required protocol envelope.
- Timestamps are generated locally in ISO-8601 UTC format.
- O2PNG integration is intentionally left at the application layer; this skill does not invent an O2PNG endpoint that is not present in the supplied API.

## Troubleshooting

### Connection refused

Verify:

```bash
curl -fsS http://localhost:8888/lumenis-os/health
curl -fsS http://localhost:9003/health
```

If your deployment uses different addresses:

```bash
export LUMENIS_GATEWAY_URL="http://127.0.0.1:YOUR_GATEWAY_PORT"
export AETHERIX_URL="http://127.0.0.1:YOUR_AETHERIX_PORT"
```

### Timeout

Increase:

```bash
export LUMENIS_TIMEOUT_MS=30000
```

### MCP host does not see tools

Confirm the host launches:

```bash
node /absolute/path/to/bin/lumenis-mcp.mjs
```

and that stdout is reserved for MCP JSON-RPC traffic.

## Architecture

```text
MCP Host
   |
   | stdio / JSON-RPC 2.0
   v
lumenis-mcp.mjs
   |
   +---- HTTP ----> Lumenis Gateway :8888
   |                 |
   |                 +-- /lumenis-os/health
   |                 +-- /lumenis-os/chat
   |                 +-- /status
   |                 +-- /aetherix/sanctuary
   |                 +-- /aetherix/memory
   |
   +---- HTTP ----> Aetherix :9003
                     |
                     +-- /health
```
