#!/usr/bin/env bash
set -euo pipefail
DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DEV_DIR")"
export HA_DEV_RUNTIME_DIR="${HA_DEV_RUNTIME_DIR:-$DEV_DIR/.runtime}"
mkdir -p "$HA_DEV_RUNTIME_DIR/config/www"
for name in configuration.yaml mediarr-dashboard.yaml; do
  if [[ ! -f "$HA_DEV_RUNTIME_DIR/config/$name" ]]; then
    cp "$DEV_DIR/config/$name" "$HA_DEV_RUNTIME_DIR/config/$name"
  fi
done
build_dir=$(mktemp -d)
trap 'rm -rf "$build_dir"' EXIT
mkdir -p "$build_dir/scripts"
cp "$ROOT_DIR"/*.js "$build_dir/"
cp "$ROOT_DIR/scripts/build-single-file.sh" "$build_dir/scripts/"
bash "$build_dir/scripts/build-single-file.sh"
node --check "$build_dir/mediarr-card.js"
cp "$build_dir/mediarr-card.js" "$HA_DEV_RUNTIME_DIR/config/www/mediarr-card.js"
npm ci --prefix "$DEV_DIR" --cache "${NPM_CONFIG_CACHE:-$HA_DEV_RUNTIME_DIR/npm-cache}" --no-audit --no-fund
# System Chromium can be used by setting CHROMIUM_PATH; otherwise install the
# exact Chromium revision required by the locked Playwright version.
if [[ -z "${CHROMIUM_PATH:-}" ]]; then
  export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HA_DEV_RUNTIME_DIR/browsers}"
  "$DEV_DIR/node_modules/.bin/playwright" install chromium
fi
docker compose -p mediarr-card-dev -f "$DEV_DIR/compose.yaml" pull
