# one2lvos_ix

Atomic recovery-first system image with:

- Infinity Glass-style CLI runtime
- plugin/module architecture
- boot-first recovery flow
- web loader/control surface
- AI mesh for explanation and approved actions
- offline docs
- snapshot + restore
- audit log + jobs log
- Google Drive bridge
- Moltbook bridge
- packaging notes for deb/rpm

## Design target

This system is built so a low-context operator can:

1. boot it
2. understand what it is
3. see what is wrong
4. use guided recovery
5. continue operation without patching files by hand

## Core idea

The CLI runtime is the foundation.
The web UI is the loader and control surface.
The AI layer helps explain and orchestrate only approved local actions.

## Quick start

```bash
cp .env.example .env
./install.sh
./start.sh
```

Then open:

- http://localhost:8080

## CLI examples

```bash
./bin/one2lvos_ix boot
./bin/one2lvos_ix boot --interactive
./bin/one2lvos_ix list-modules
./bin/one2lvos_ix run recovery
./bin/one2lvos_ix doctor
```

## Terminal examples in web loader

- help
- login
- policy
- task list
- task run boot.status
- task run module.run sensors
- task run docs.read operator_quickstart.md
- task run boot.snapshot
- task run boot.restore <snapshot-id>
- drive list
- moltbook me
- search recovery
- ai explain the current recovery mode

## Safety boundary

This is a recovery-oriented orchestrator with approved local operations.
It is not an unrestricted autonomous system operator across arbitrary hosts, accounts, or networks.
