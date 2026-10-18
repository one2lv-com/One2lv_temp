#!/usr/bin/env bash
set -euo pipefail

module_main() {
  local sim_mode="$1"
  local heading
  heading="$(sim_read_heading)"
  say "${DIM}[FLUX]${RST} Bringing compass overlay online..."
  sim_delay "$sim_mode" 0.4
  say "${DIM}[FLUX]${RST} Heading baseline: ${heading}°"
  say "${DIM}[FLUX]${RST} Breath sequence: inhale 4, hold 4, exhale 4"
}
