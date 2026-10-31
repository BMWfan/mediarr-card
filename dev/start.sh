#!/usr/bin/env bash
set -euo pipefail
DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HA_DEV_RUNTIME_DIR="${HA_DEV_RUNTIME_DIR:-$DEV_DIR/.runtime}"
export HA_DEV_PORT="${HA_DEV_PORT:-8124}"
docker compose -p mediarr-card-dev -f "$DEV_DIR/compose.yaml" up -d --wait --wait-timeout 180
python3 "$DEV_DIR/onboard.py"
