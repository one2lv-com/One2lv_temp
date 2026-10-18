#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  say "${DIM}[RECOVERY]${RST} Establishing guided recovery state..."
  sim_delay "$sim_mode" 0.5
  say "${DIM}[RECOVERY]${RST} Recovery mode: $(sim_read_recovery_state)"
  say "${DIM}[RECOVERY]${RST} Safe path: read docs, inspect logs, snapshot before edits"
}
