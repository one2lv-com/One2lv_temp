#!/bin/bash
# One2lvOS Network Service — shortcut launcher
cd "$(dirname "$0")"
exec bash start-network-service.sh "$@"
