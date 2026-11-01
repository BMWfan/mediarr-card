#!/usr/bin/env bash
set -euo pipefail
DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HA_DEV_RUNTIME_DIR="${HA_DEV_RUNTIME_DIR:-$DEV_DIR/.runtime}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HA_DEV_RUNTIME_DIR/browsers}"
python3 "$DEV_DIR/onboard.py"
node --test "$DEV_DIR/../tests/media-library.test.mjs" "$DEV_DIR/../tests/media-metadata.test.mjs"
node "$DEV_DIR/../tests/e2e/mediarr.mjs"
node "$DEV_DIR/../tests/e2e/library.mjs"
node "$DEV_DIR/../tests/e2e/metadata.mjs"
