#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  say "${DIM}[OPTICS]${RST} Calibrating optics pipeline..."
  sim_delay "$sim_mode" 0.4
}
