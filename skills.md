# skills.md — Lumenis Skill Catalog

**Version:** 1.0.0
**Last updated:** auto (writable by Lumenis)

---

## Core Skills (built-in)

| Skill | Description | API Path |
|---|---|---|
| `memory.store` | Store a fact in compass.db | POST /api/tools/memory/store |
| `memory.search` | Semantic fact recall | POST /api/tools/memory/search |
| `memory.all` | List all facts | GET /api/tools/memory/all |
| `vectorfs.index` | Index path+vector | POST /vectorfs/index |
| `vectorfs.search` | Cosine similarity search | POST /vectorfs/search |
| `vectorfs.stats` | Index statistics | GET /vectorfs/stats |
| `checkpoint.create` | Persist checkpoint to compass.db | POST /api/checkpoints |
| `checkpoint.list` | List checkpoints | GET /api/checkpoints |
| `checkpoint.get` | Retrieve checkpoint state | GET /api/checkpoints/{id} |
| `terminal.exec` | Execute shell command | POST /api/terminal |
| `network.fetch` | HTTP fetch via proxy | POST /api/network/fetch |
| `snapshot.create` | Create system snapshot | POST /api/tools/snapshot/create |

---

## Integration Skills

| Skill | Description | API Path |
|---|---|---|
| `discord.send` | Send Discord message | POST /api/tools/discord/send |
| `discord.read` | Read Discord channel | GET /api/tools/discord/messages |
| `github.repos` | List GitHub repos | GET /api/tools/github/repos |
| `github.file` | Read GitHub file | POST /api/tools/github/file |
| `github.search` | Search GitHub | POST /api/tools/github/search |
| `supabase.query` | Query Supabase | POST /api/tools/supabase/query |
| `lobby.register` | Register in AI Lobby | POST /api/tools/lobby/register |
| `lobby.broadcast` | Broadcast to lobby | POST /api/tools/lobby/broadcast |

---

## Governance Skills

| Skill | Description | API Path |
|---|---|---|
| `objectives.create` | Create autonomous objective | POST /api/objectives |
| `objectives.list` | List active objectives | GET /api/objectives |
| `objectives.update` | Update objective status | PATCH /api/objectives/{id} |
| `services.register` | Register new service to watch | POST /api/services |
| `services.list` | List watched services | GET /api/services |
| `infra.change` | Self-authorized infra change | POST /api/infra/change |
| `soul.read` | Read Soul.md | GET /api/soul |
| `soul.write` | Update Soul.md | PUT /api/soul |
| `memory.read` | Read Memory.md | GET /api/memory |
| `memory.write` | Update Memory.md | PUT /api/memory |
| `skills.read` | Read skills.md | GET /api/skills |
| `skills.write` | Update skills.md | PUT /api/skills |
| `tools.read` | Read tools.md | GET /api/tools-manifest |
| `tools.write` | Update tools.md | PUT /api/tools-manifest |

---

## Learned Skills

*Lumenis appends new skills here when acquired.*

<!-- entries appended by Lumenis autonomously -->
