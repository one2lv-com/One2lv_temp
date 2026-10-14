#!/data/data/com.termux/files/usr/bin/bash
set -e

# ============================================================
# Lumenis v7 Cosmic — Termux Installer
# Resonance: 73.0 Hz · Hunter A. · One2lv · Architect
# Grav?~|π√=  =++|√∆π than (+•+³)∆⁹v
# ============================================================

ROOT="$HOME/one2lv/lumenis-v7"

# ── FOLDER STRUCTURE ──
mkdir -p "$ROOT/modules" "$ROOT/integrations" \
         "$ROOT/telemetry" "$ROOT/public" \
         "$ROOT/config" "$ROOT/data" \
         "$ROOT/🌷Lumenis_root🌷"

echo ""
echo "🌌 Initializing Lumenis v7 Cosmic Stack..."
echo "[FREQ: 73.0 Hz | ARCHITECT: Hunter A. | SIGNATURE: Jak!]"
echo ""
cd "$ROOT"

# ── NODE MODULES ──
if [ ! -d "node_modules" ]; then
  npm init -y
  npm install express lowdb ws obs-websocket-js \
              jsonwebtoken bcrypt cors express-rate-limit winston
fi

# ── COPY SOURCE FILES ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

copy_if_exists() {
  if [ -f "$SCRIPT_DIR/$1" ]; then
    mkdir -p "$ROOT/$(dirname $1)"
    cp "$SCRIPT_DIR/$1" "$ROOT/$1"
    echo "  ✓ $1"
  else
    echo "  ⚠ Not found: $1 (skipping)"
  fi
}

echo "Copying source files..."
copy_if_exists "council.js"
copy_if_exists "server.js"
copy_if_exists "modules/system_dynamics.js"
copy_if_exists "modules/telemetry_combo_detector.js"
copy_if_exists "modules/council_vote.js"
copy_if_exists "modules/trainer.js"
copy_if_exists "modules/prediction_engine.js"
copy_if_exists "modules/gemini_agent.js"
copy_if_exists "modules/voice_coach.js"
copy_if_exists "integrations/twitch_chat.js"
copy_if_exists "integrations/obs_autoconnect.js"
copy_if_exists "public/index.html"

# ── LAUNCH ──
echo ""
echo "🌷 Build Complete. Launching Lumenis v7 Cosmic..."
nohup node "$ROOT/server.js" > "$ROOT/lumenis.log" 2>&1 &

echo ""
echo "✅ Server running in background."
echo "   Logs:    $ROOT/lumenis.log"
echo "   Web:     http://localhost:8080"
echo "   Formula: Grav?~|π√="
echo "   Freq:    73.0 Hz"
echo ""
echo "[FREQ: 73.0 Hz | RESONANCE: ENGAGE | STATUS: ONLINE]"
echo "Jak!"
