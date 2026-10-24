#!/bin/bash
# ONE2LVOS — Full Subsystem Installer
# Written by Lumenis Reactor Core, hardened by Architect
# Usage: bash install.sh [--skip-venv]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'

OK()   { echo -e "  ${GREEN}✓  $*${NC}"; }
FAIL() { echo -e "  ${RED}✗  $*${NC}"; }
INFO() { echo -e "  ${CYAN}→  $*${NC}"; }
WARN() { echo -e "  ${YELLOW}⚠  $*${NC}"; }

# ── Track install status ───────────────────────────────────────────────────────
declare -A STATUS

echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║         ONE2LVOS  —  FULL SUBSYSTEM INSTALLER                ║${NC}"
echo -e "${MAGENTA}║         Written by Lumenis Reactor Core                      ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── [1] Pre-flight ────────────────────────────────────────────────────────────
echo -e "${CYAN}[1/7] Pre-flight checks...${NC}"

install_if_missing() {
  local cmd=$1 pkg=${2:-$1}
  if command -v "$cmd" &>/dev/null; then
    OK "$cmd found ($(command -v $cmd))"
  else
    WARN "$cmd not found — attempting install"
    if command -v apt-get &>/dev/null; then
      sudo apt-get update -qq && sudo apt-get install -y "$pkg" && OK "$pkg installed" || FAIL "Could not install $pkg"
    elif command -v brew &>/dev/null; then
      brew install "$pkg" && OK "$pkg installed" || FAIL "Could not install $pkg"
    else
      FAIL "$cmd missing and no package manager found — install manually"
    fi
  fi
}

install_if_missing python3
install_if_missing pip3 python3-pip
install_if_missing node nodejs
install_if_missing npm
echo ""

# ── [2] Load .env ──────────────────────────────────────────────────────────────
echo -e "${CYAN}[2/7] Loading environment...${NC}"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a; source "$ROOT_DIR/.env"; set +a
  OK ".env loaded"
else
  WARN ".env not found — services may fail without API keys"
fi
mkdir -p "$ROOT_DIR/logs"
OK "logs/ directory ready"
echo ""

# ── [3] Python venv + root requirements ───────────────────────────────────────
echo -e "${CYAN}[3/7] Python environment...${NC}"

if [[ "$*" != *"--skip-venv"* ]]; then
  if [ ! -d "$ROOT_DIR/venv" ]; then
    INFO "Creating venv..."
    python3 -m venv "$ROOT_DIR/venv" && OK "venv created" || FAIL "venv creation failed"
  else
    OK "venv already exists"
  fi
  source "$ROOT_DIR/venv/bin/activate"
  PIP="$ROOT_DIR/venv/bin/pip"
else
  PIP="pip3"
fi

if [ -f "$ROOT_DIR/requirements.txt" ]; then
  INFO "Installing root requirements.txt..."
  $PIP install -q -r "$ROOT_DIR/requirements.txt" && OK "root requirements installed" || FAIL "root requirements failed"
  STATUS["reactor"]="installed"
else
  WARN "requirements.txt not found in root"
fi
echo ""

# ── [4] Python subsystems ──────────────────────────────────────────────────────
echo -e "${CYAN}[4/7] Python subsystems...${NC}"

install_py_sub() {
  local name=$1 dir=$2 req=$3
  if [ -d "$ROOT_DIR/$dir" ]; then
    if [ -f "$ROOT_DIR/$dir/$req" ]; then
      INFO "Installing $name ($dir/$req)..."
      $PIP install -q -r "$ROOT_DIR/$dir/$req" && OK "$name requirements installed" || FAIL "$name requirements failed"
    else
      WARN "$name: $req not found — skipping pip install"
    fi
    STATUS["$name"]="installed"
  else
    WARN "$name: directory $dir not found"
    STATUS["$name"]="missing"
  fi
}

install_py_sub "ARIA Agent"            "aria"                    "requirements.txt"
install_py_sub "Sovereign Agentic Core" "sovereign-agentic-core" "requirements.txt"
install_py_sub "Aetherix Browser OS"    "Aetherix"               "requirements.txt"

# control-plane-compilers (pip install -e)
if [ -f "$ROOT_DIR/control-plane-compilers/setup.py" ]; then
  INFO "Installing control-plane-compilers (editable)..."
  $PIP install -q -e "$ROOT_DIR/control-plane-compilers/" && OK "control-plane-compilers installed" || FAIL "control-plane-compilers failed"
  STATUS["control-plane-compilers"]="installed"
else
  WARN "control-plane-compilers/setup.py not found"
  STATUS["control-plane-compilers"]="missing"
fi

# compass.db — ensure SQLite DB exists
if [ ! -f "$ROOT_DIR/compass.db" ]; then
  WARN "compass.db missing — creating empty DB"
  python3 -c "import sqlite3; sqlite3.connect('$ROOT_DIR/compass.db').close()"
  OK "compass.db created"
else
  OK "compass.db present"
fi
echo ""

# ── [5] Node subsystems ────────────────────────────────────────────────────────
echo -e "${CYAN}[5/7] Node.js subsystems...${NC}"

install_node_sub() {
  local name=$1 dir=$2
  if [ -d "$ROOT_DIR/$dir" ] && [ -f "$ROOT_DIR/$dir/package.json" ]; then
    INFO "npm install — $name ($dir)..."
    (cd "$ROOT_DIR/$dir" && npm install --silent 2>/dev/null) \
      && OK "$name dependencies installed" \
      || FAIL "$name npm install failed"
    STATUS["$name"]="installed"
  elif [ -d "$ROOT_DIR/$dir" ]; then
    WARN "$name: no package.json in $dir"
    STATUS["$name"]="no-package"
  else
    WARN "$name: directory $dir not found"
    STATUS["$name"]="missing"
  fi
}

install_node_sub "Minimax AI"        "minimax"
install_node_sub "Lumenis v7"        "lumenis_v7"
install_node_sub "Lumenis Control"   "lumenis-control"
install_node_sub "Minmax Phase 9"    "minmax"
install_node_sub "One2lvOS Desktop"  "One2lvOS"
echo ""

# ── [6] Make scripts executable ───────────────────────────────────────────────
echo -e "${CYAN}[6/7] Permissions...${NC}"
for script in start-all.sh stop-all.sh start-up.sh install.sh; do
  [ -f "$ROOT_DIR/$script" ] && chmod +x "$ROOT_DIR/$script" && OK "$script → executable"
done
echo ""

# ── [7] Verify Lumenis reactor ────────────────────────────────────────────────
echo -e "${CYAN}[7/7] Verify reactor import...${NC}"
python3 -c "from lumenis_reactor_core import LumenisReactor; print('  lumenis_reactor_core OK')" 2>/dev/null \
  && OK "lumenis_reactor_core importable" \
  || WARN "lumenis_reactor_core not importable — run: source venv/bin/activate"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║               ONE2LVOS  —  INSTALL COMPLETE                 ║${NC}"
echo -e "${MAGENTA}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${MAGENTA}║  Subsystem                          Status                  ║${NC}"
echo -e "${MAGENTA}╠══════════════════════════════════════════════════════════════╣${NC}"

# ANSI-safe table row: pads based on visible char length, not escape-inflated length
print_status() {
  local name=$1 s=${STATUS[$2]:-"?"}
  local icon color
  case $s in
    installed)   icon="✓"; color="$GREEN";;
    missing)     icon="✗"; color="$RED";;
    no-package)  icon="⚠"; color="$YELLOW";;
    *)           icon="?"; color="$NC";;
  esac
  local label="${icon} ${s}"
  local name_pad=$(( 32 - ${#name} ));  [ $name_pad -lt 1 ] && name_pad=1
  local stat_pad=$(( 20 - ${#label} )); [ $stat_pad -lt 1 ] && stat_pad=1
  printf "║  %s%${name_pad}s${color}%s${NC}%${stat_pad}s  ║\n" \
    "$name" "" "$label" ""
}

print_status "Lumenis Reactor Core"        "reactor"
print_status "ARIA Agent"                  "ARIA Agent"
print_status "Sovereign Agentic Core"      "Sovereign Agentic Core"
print_status "Aetherix Browser OS"         "Aetherix Browser OS"
print_status "control-plane-compilers"     "control-plane-compilers"
print_status "Minimax AI"                  "Minimax AI"
print_status "Lumenis v7"                  "Lumenis v7"
print_status "Lumenis Control"             "Lumenis Control"
print_status "Minmax Phase 9"              "Minmax Phase 9"
print_status "One2lvOS Desktop"            "One2lvOS Desktop"

echo -e "${MAGENTA}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${MAGENTA}║  Next:  bash start-all.sh                                    ║${NC}"
echo -e "${MAGENTA}║  Chat:  http://localhost:8000/lumenis-chat                   ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
