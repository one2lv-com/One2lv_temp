# Boot

Boot state is stored in:
- `workspace/boot-state.json`

On startup:
- increment boot count
- detect prior clean or unclean shutdown
- set recovery mode if needed
- mark current runtime as not yet clean

On server exit signal:
- mark shutdown clean
