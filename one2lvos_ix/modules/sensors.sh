#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  say "${DIM}[SENSORS]${RST} Checking sensor bus..."
  sim_delay "$sim_mode" 0.4
  say "${DIM}[SENSORS]${RST} Snapshot: $(sim_read_sensors)"
}
