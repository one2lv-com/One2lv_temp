#!/bin/bash
set -e

echo "=== one2lvos_ix install ==="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[ok] created .env from template"
else
  echo "[ok] existing .env kept"
fi

mkdir -p workspace
mkdir -p workspace/.snapshots
mkdir -p logs

npm install
chmod +x bin/one2lvos_ix
chmod +x install.sh start.sh rebuild.sh
find modules -type f -name "*.sh" -exec chmod +x {} \;
find lib -type f -name "*.sh" -exec chmod +x {} \;

echo "[ok] install complete"
echo "Run: ./start.sh"
