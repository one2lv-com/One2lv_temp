#!/usr/bin/env bash
set -euo pipefail

# LUMENIS CONTROL - Auto Setup + Supabase + Dual Service Launcher
# Usage:
#   ./auto-run-lumenis.sh
# Optional env vars:
#   SKIP_SUPABASE=1        # skip schema push
#   PYTHON_PORT=3002       # python backend port
#   NODE_PORT=3000         # node backend port
#   USE_PM2=auto|1|0       # prefer PM2 if installed / force on / force off
#   INSTALL_PM2=1          # install pm2 globally if USE_PM2=1 and missing

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PYTHON_PORT="${PYTHON_PORT:-3002}"
NODE_PORT="${NODE_PORT:-3000}"
SKIP_SUPABASE="${SKIP_SUPABASE:-0}"
USE_PM2="${USE_PM2:-auto}"
INSTALL_PM2="${INSTALL_PM2:-0}"

log()  { echo "[LUMENIS] $*"; }
warn() { echo "[LUMENIS][WARN] $*"; }
err()  { echo "[LUMENIS][ERROR] $*"; }

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    err "Missing command: $cmd"
    if [[ -n "$hint" ]]; then
      echo "Hint: $hint"
    fi
    exit 1
  fi
}

load_env_file() {
  if [[ ! -f .env ]]; then
    if [[ -f .env.example ]]; then
      cp .env.example .env
      warn "Created .env from .env.example. Please review secrets/keys when done."
    else
      warn "No .env.example found; continuing without .env file."
      return 0
    fi
  fi

  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
}

setup_node() {
  require_cmd node "Install Node.js 18+"
  require_cmd npm "Install npm"
  log "Installing Node dependencies..."
  npm install
}

setup_python() {
  require_cmd python3 "Install Python 3.11+"

  log "Setting up Python backend virtualenv..."
  cd "$ROOT_DIR/python-backend"

  if [[ ! -d venv ]]; then
    python3 -m venv venv
  fi

  # shellcheck disable=SC1091
  source venv/bin/activate
  python3 -m pip install -q --upgrade pip
  python3 -m pip install -q -r requirements.txt

  cd "$ROOT_DIR"
}

acquire_wake_lock() {
  if command -v termux-wake-lock >/dev/null 2>&1; then
    log "Acquiring Android wake lock for persistent sockets..."
    termux-wake-lock || warn "termux-wake-lock failed; continuing without wake lock."
  fi
}

push_supabase_schema() {
  if [[ "$SKIP_SUPABASE" == "1" ]]; then
    warn "SKIP_SUPABASE=1 set; skipping schema push."
    return 0
  fi

  if [[ ! -f "$ROOT_DIR/supabase-schema.sql" ]]; then
    warn "supabase-schema.sql not found; skipping schema push."
    return 0
  fi

  local db_uri="${DATABASE_URL:-}"

  if [[ -z "$db_uri" && -f .env ]]; then
    db_uri="$(grep -E '^DATABASE_URL=' .env | head -n1 | cut -d'=' -f2- || true)"
  fi

  if [[ -z "$db_uri" ]]; then
    warn "DATABASE_URL not set. Skipping Supabase schema push."
    warn "Set DATABASE_URL in .env (or env) and re-run to auto-apply schema."
    return 0
  fi

  if ! command -v psql >/dev/null 2>&1; then
    warn "DATABASE_URL is set but psql is not installed. Skipping schema push."
    warn "Install PostgreSQL client (psql) or set SKIP_SUPABASE=1 to suppress this warning."
    return 0
  fi

  log "Pushing supabase-schema.sql via DATABASE_URL..."
  psql "$db_uri" -v ON_ERROR_STOP=1 -f "$ROOT_DIR/supabase-schema.sql"
  log "Supabase schema applied successfully."
}

ensure_pm2() {
  if command -v pm2 >/dev/null 2>&1; then
    return 0
  fi

  if [[ "$USE_PM2" != "1" ]]; then
    return 1
  fi

  if [[ "$INSTALL_PM2" != "1" ]]; then
    err "USE_PM2=1 but pm2 is not installed."
    echo "Set INSTALL_PM2=1 to auto-install it with npm."
    exit 1
  fi

  log "Installing pm2 globally..."
  npm install -g pm2
}

start_services_direct() {
  log "Starting Python backend on :$PYTHON_PORT"
  cd "$ROOT_DIR/python-backend"
  # shellcheck disable=SC1091
  source venv/bin/activate
  uvicorn main:app --host 0.0.0.0 --port "$PYTHON_PORT" > "$ROOT_DIR/python-backend.log" 2>&1 &
  PY_PID=$!

  cd "$ROOT_DIR"
  log "Starting Node backend on :$NODE_PORT"
  PORT="$NODE_PORT" PYTHON_API_URL="http://localhost:$PYTHON_PORT" npm start > "$ROOT_DIR/node-backend.log" 2>&1 &
  NODE_PID=$!

  cleanup() {
    echo
    log "Stopping services..."
    kill "$PY_PID" "$NODE_PID" >/dev/null 2>&1 || true
    wait "$PY_PID" "$NODE_PID" 2>/dev/null || true
    if command -v termux-wake-unlock >/dev/null 2>&1; then
      termux-wake-unlock >/dev/null 2>&1 || true
    fi
    log "Stopped."
  }

  trap cleanup INT TERM EXIT

  log "Services online:"
  echo "  - Lumenis Control: http://localhost:$NODE_PORT"
  echo "  - Sovereign Core:  http://localhost:$PYTHON_PORT"
  echo "  - Node log:        $ROOT_DIR/node-backend.log"
  echo "  - Python log:      $ROOT_DIR/python-backend.log"
  echo
  log "Press Ctrl+C to stop."

  wait "$PY_PID" "$NODE_PID"
}

start_services_pm2() {
  require_cmd pm2 "Install pm2 or run with USE_PM2=0"

  log "Starting services under PM2 supervision..."
  NODE_PORT="$NODE_PORT" PYTHON_PORT="$PYTHON_PORT" pm2 start "$ROOT_DIR/lumenis.config.js" --update-env
  pm2 save >/dev/null

  log "Services online under PM2:"
  echo "  - Lumenis Control: http://localhost:$NODE_PORT"
  echo "  - Sovereign Core:  http://localhost:$PYTHON_PORT"
  echo "  - PM2 status:      pm2 status"
  echo "  - PM2 logs:        pm2 logs"
  echo "  - PM2 stop:        pm2 delete lumenis-node-bridge lumenis-sovereign-core"
  if command -v termux-wake-unlock >/dev/null 2>&1; then
    echo "  - Release wake lock: termux-wake-unlock"
  fi
}

start_services() {
  local use_pm2_resolved="0"

  if [[ "$USE_PM2" == "1" ]]; then
    ensure_pm2
    use_pm2_resolved="1"
  elif [[ "$USE_PM2" == "auto" ]] && command -v pm2 >/dev/null 2>&1; then
    use_pm2_resolved="1"
  fi

  if [[ "$use_pm2_resolved" == "1" ]]; then
    start_services_pm2
  else
    start_services_direct
  fi
}

main() {
  log "Bootstrapping Lumenis Control"
  load_env_file
  setup_node
  setup_python
  acquire_wake_lock
  push_supabase_schema
  start_services
}

main "$@"
