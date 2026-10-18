#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  say "${DIM}[POWER]${RST} Verifying rails..."
  sim_delay "$sim_mode" 0.3
  say "${DIM}[POWER]${RST} Rail: $(sim_read_power_rail)"
}
