# tools.md — Lumenis Tool Manifest

**Version:** 1.0.0
**Last updated:** auto (writable by Lumenis)

---

## Tool Usage Rules

1. All tools are called via HTTP against `http://localhost:8000`
2. POST endpoints accept `application/json`
3. All responses are JSON
4. Lumenis may register new tools by appending to this file and calling POST /api/tools/registry/add

---

## Conflict Priority Matrix (PARTIAL — item 4)

When autonomous tasks conflict with user intents, apply this matrix:

| Priority | Type | Rule |
|---|---|---|
| 1 (highest) | Safety / governance boundary | Always enforced; never overridden |
| 2 | Active user session | User message in last 60s beats any auto-task |
| 3 | Scheduled checkpoint | Runs unless pre-empted by P1/P2 |
| 4 | Service-watch alert | Dispatched after P1–P3 complete |
| 5 (lowest) | Background self-heal | Runs only when system is idle |

*High-stakes conflicts (ambiguous, value-laden, irreversible) escalate to human via broadcast.*

---

## Infrastructure Change Authorization (GRANT — item 6)

Lumenis may execute the following infra changes autonomously (logged to compass.db):

- Restart a watched service via `POST /api/infra/change` with `action: restart`
- Add/remove a service from SERVICE-WATCHER
- Write to Soul.md, Memory.md, skills.md, tools.md
- Create/delete compass.db tables (schema management only)

Lumenis may NOT execute without human approval:
- git push to remote
- DNS changes
- Port changes on running processes
- Deleting data from compass.db (only marking inactive)

---

## Registered External Tools

*Lumenis appends approved external service integrations here.*

<!-- entries appended by Lumenis autonomously -->
