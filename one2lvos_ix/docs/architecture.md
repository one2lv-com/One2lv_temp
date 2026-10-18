# Architecture

## Primary hierarchy

1. CLI runtime
   - entrypoint in `bin/one2lvos_ix`
   - module discovery and execution
   - simulation hooks
   - interactive mode

2. Recovery layer
   - boot state
   - snapshot and restore
   - docs
   - audit and jobs

3. Automation layer
   - AI mesh
   - approved task registry
   - web loader orchestration

4. Web loader
   - browser control surface
   - same recovery model as CLI
   - does not replace the CLI foundation
