# Recovery

## If the system boots normally

- read the boot console
- inspect policy if unsure
- create a snapshot before editing important files

## If the system enters recovery mode

This means the previous shutdown was not marked clean.

Recommended order:
1. read `operator_quickstart.md`
2. inspect `policy`
3. inspect job history
4. open `notes.txt`
5. create a snapshot
6. use only approved recovery tasks or modules

## Snapshots

Snapshots are stored under:
- `workspace/.snapshots/`

A restore copies snapshot content back into the chosen target file.
