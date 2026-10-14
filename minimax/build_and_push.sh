#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  ∆One2lv∆ Witness Agentic Core v8 — Build & Push
#  Builds Raccoon Orbital HUD (Vite) and pushes to GitHub
#  Repo: github.com/one2lv-com/minimax  Branch: main
#
#  Usage:
#    export GITHUB_PAT="your_token_here"
#    ./build_and_push.sh
#
#  Or inline:
#    GITHUB_PAT="your_token" ./build_and_push.sh
#
#  Options:
#    --source-only   Skip build; push source files only
#    --no-dist       Skip pushing dist/ output
#    --msg "..."     Custom commit message
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# ── Config ─────────────────────────────────────────────────────
REPO="one2lv-com/minimax"
BRANCH="main"
SANDBOX="artifacts/mockup-sandbox"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Flags ──────────────────────────────────────────────────────
SOURCE_ONLY=false
NO_DIST=false
CUSTOM_MSG=""

for arg in "$@"; do
  case "$arg" in
    --source-only) SOURCE_ONLY=true ;;
    --no-dist)     NO_DIST=true ;;
    --msg)         shift; CUSTOM_MSG="$1" ;;
    --msg=*)       CUSTOM_MSG="${arg#--msg=}" ;;
  esac
done

# ── PAT check ──────────────────────────────────────────────────
PAT="${GITHUB_PAT:-}"
if [[ -z "$PAT" ]]; then
  echo "❌  ERROR: GITHUB_PAT is not set."
  echo "    Run:  export GITHUB_PAT=\"ghp_your_token_here\""
  exit 1
fi

echo ""
echo "∆ONE2LV∆ BUILD & PUSH"
echo "══════════════════════════════════"
echo "  Repo   : $REPO @ $BRANCH"
echo "  Target  : $SANDBOX"
echo ""

# ── Step 1: Build ──────────────────────────────────────────────
if [[ "$SOURCE_ONLY" == false ]]; then
  echo "▶  [1/3] Building Vite production bundle..."
  cd "$SCRIPT_DIR/$SANDBOX"
  PORT=3000 BASE_PATH=/ NODE_ENV=production npm run build
  cd "$SCRIPT_DIR"
  echo "✓  Build complete → $SANDBOX/dist/"
  echo ""
else
  echo "⏭  [1/3] Skipping build (--source-only)"
  echo ""
fi

# ── Step 2: Collect commit message ─────────────────────────────
if [[ -z "$CUSTOM_MSG" ]]; then
  GIT_SHORT="$(git --no-optional-locks log -1 --format='%h %s' 2>/dev/null || echo 'manual')"
  COMMIT_MSG="build: Raccoon Orbital HUD — dist + source [$GIT_SHORT]"
else
  COMMIT_MSG="$CUSTOM_MSG"
fi

echo "▶  [2/3] Commit message:"
echo "   \"$COMMIT_MSG\""
echo ""

# ── Step 3: Push to GitHub ─────────────────────────────────────
echo "▶  [3/3] Pushing to GitHub..."
python3 "$SCRIPT_DIR/push_to_github.py" \
  --repo    "$REPO"       \
  --branch  "$BRANCH"     \
  --pat     "$PAT"        \
  --msg     "$COMMIT_MSG" \
  $( [[ "$NO_DIST" == true ]] && echo "--no-dist" || echo "" ) \
  "$SANDBOX"

echo ""
echo "══════════════════════════════════"
echo "✓  Done. https://github.com/$REPO/tree/$BRANCH"
echo ""
