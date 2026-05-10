#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${HA_CONFIG_DIR:-}" ]]; then
  echo "Error: HA_CONFIG_DIR is not set. Example:" >&2
  echo "  export HA_CONFIG_DIR=/path/to/your/ha-config" >&2
  exit 1
fi

DEPLOY_DIRS=(
  "$HA_CONFIG_DIR/www/community/mediarr-card"
  "$HA_CONFIG_DIR/www/mediarr-card"
)

bash "$ROOT_DIR/scripts/build-single-file.sh"

deployed=0
for DEPLOY_DIR in "${DEPLOY_DIRS[@]}"; do
  if [[ -d "$DEPLOY_DIR" ]]; then
    cp "$ROOT_DIR/mediarr-card.js" "$DEPLOY_DIR/mediarr-card.js"
    gzip -9 -c "$DEPLOY_DIR/mediarr-card.js" > "$DEPLOY_DIR/mediarr-card.js.gz"
    echo "Deployed to $DEPLOY_DIR (js + gz)"
    deployed=1
  fi
done

if [[ $deployed -eq 0 ]]; then
  echo "Warning: no deploy directories found under $HA_CONFIG_DIR/www/" >&2
fi
