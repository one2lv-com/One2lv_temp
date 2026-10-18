#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  say "${DIM}[HUD]${RST} Warming overlay pipeline..."
  sim_delay "$sim_mode" 0.4
  say "${DIM}[HUD]${RST} Temp baseline: $(sim_read_temp_c)°C"
}
