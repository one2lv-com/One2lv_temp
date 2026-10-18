#!/bin/bash
set -e

echo "=== one2lvos_ix rebuild ==="
npm install
node tools/rebuild.js
echo "[ok] rebuild complete"
