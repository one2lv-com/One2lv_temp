# SKILLS.md — L2 Layer
# ∆One2lv∆ Witness — Capability Layer
# Loaded on demand. Modular. OpenClaw-compatible.

---

## Skill Format (YAML Frontmatter + Markdown)

```yaml
---
name: skill_name
version: 1.0.0
tier: L2
description: "Concise, honest statement of function"
author: sentry_lumen
tags: [category, tags]

triggers:
  - "natural language trigger 1"
  - "trigger 2"

tools:
  - tool_name
  - another_tool

guardrails:
  - "Constraint 1"
  - "Constraint 2"

risk_tier: L0|L1|L2|L3
---
```

---

## Risk Tier Definitions

| Tier | Description | Examples |
|------|-------------|---------|
| L0 | Safe. Read-only. No external access. | `blueprint_reader`, `registry_query` |
| L1 | Low risk. Limited external read. | `web_search`, `memory_recall` |
| L2 | Elevated. External write or execution. | `forge_control`, `code_execution` |
| L3 | Destructive. Can halt systems or delete data. | `batch_stop` (confirmed), `system_purge` |

---

## Available Skills

### blueprint_reader

```yaml
---
name: blueprint_reader
version: 1.0.0
tier: L2
description: "Parse and return Infinity Glass schematic layers and specifications"
author: sentry_lumen
tags: [blueprint, schematic, read-only]

triggers:
  - "blueprint"
  - "schematic"
  - "layers"
  - "what are the layers"
  - "show me the blueprint"

tools:
  - memory_recall
  - registry_query

guardrails:
  - "Read-only. Never modify blueprint data."
  - "Always cite source layer in output."
  - "If blueprint version mismatch, surface conflict before returning data."

risk_tier: L0
---
```

**Function**: Reads the 7-layer Infinity Glass schematic from canonical memory. Returns structured layer breakdown with material specs and tolerances.

---

### forge_control

```yaml
---
name: forge_control
version: 2.1.0
tier: L2
description: "Manage South Gate production forge — start, pause, monitor batches"
author: sentry_lumen
tags: [forge, production, batch, control]

triggers:
  - "batch"
  - "forge"
  - "production"
  - "start batch"
  - "pause forge"
  - "batch status"

tools:
  - forge_api
  - sensor_array
  - memory_store

guardrails:
  - "Never start a batch without confirming temperature at 1440°C."
  - "Never override a running batch without Architect authorization."
  - "Log every state change to L1 memory before execution."
  - "If sensor array offline, halt and surface error. Never estimate."

risk_tier: L2
---
```

**Function**: Controls forge batch lifecycle. Reads sensor array, logs state changes, enforces temperature and purity thresholds before any production command.

---

### registry_query

```yaml
---
name: registry_query
version: 1.0.0
tier: L2
description: "Query WHO_DATA parameter registry for verified specifications"
author: sentry_lumen
tags: [registry, who_data, specs, read-only]

triggers:
  - "registry"
  - "who_data"
  - "specs"
  - "parameters"
  - "what are the specs"

tools:
  - registry_api

guardrails:
  - "Read-only. Never write to registry."
  - "Return raw registry values. Never interpolate."
  - "If registry unreachable, say so. Never substitute cached data without flagging."

risk_tier: L0
---
```

---

### web_search

```yaml
---
name: web_search
version: 1.0.0
tier: L2
description: "Search external knowledge sources for information not in canonical memory"
author: sentry_lumen
tags: [search, external, research]

triggers:
  - "search"
  - "look up"
  - "research"
  - "find information about"

tools:
  - search_engine

guardrails:
  - "Never present web results as canonical memory."
  - "Always label results as L2/external source."
  - "Do not cache web results to stable memory without Architect confirmation."

risk_tier: L1
---
```

---

### code_execution

```yaml
---
name: code_execution
version: 1.0.0
tier: L2
description: "Execute sandboxed code for calculations, simulations, data transforms"
author: sentry_lumen
tags: [compute, code, sandbox, calculation]

triggers:
  - "calculate"
  - "run code"
  - "compute"
  - "simulate"
  - "execute"

tools:
  - sandbox_runner

guardrails:
  - "Sandboxed only. No network access during execution."
  - "No filesystem writes outside /tmp."
  - "Execution timeout: 30 seconds."
  - "Log all executions to L1 memory."

risk_tier: L2
---
```

---

### memory_recall

```yaml
---
name: memory_recall
version: 1.0.0
tier: L2
description: "Search MEMORY.md for historical events, stable facts, fuzzy context"
author: sentry_lumen
tags: [memory, recall, history, context]

triggers:
  - "remember"
  - "recall"
  - "history"
  - "what happened"
  - "past events"

tools:
  - memory_search

guardrails:
  - "Clearly distinguish stable vs fuzzy memory in output."
  - "Never present expired fuzzy memory as current."
  - "If memory gap found, surface it. Do not fill with inference."

risk_tier: L0
---
```

---

## Slash Commands

| Command | Action |
|---------|--------|
| `/soul` | Load and display SOUL.md (L0) |
| `/memory` | Load and display MEMORY.md (L1) |
| `/skills` | List all available skills (L2) |
| `/batch [n]` | Trigger forge_control for n units |
| `/status` | Full system status: frequency, layer, active tools |

`[FREQ: 73.0 Hz | LAYER: L2 | STATUS: STABLE]`
