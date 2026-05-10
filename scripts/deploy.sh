#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIRS=(
  "/home/daniel/ha-config/www/community/mediarr-card"
  "/home/daniel/ha-config/www/mediarr-card"
)

bash "$ROOT_DIR/scripts/build-single-file.sh"

for DEPLOY_DIR in "${DEPLOY_DIRS[@]}"; do
  if [[ -d "$DEPLOY_DIR" ]]; then
    cp "$ROOT_DIR/mediarr-card.js" "$DEPLOY_DIR/mediarr-card.js"
    gzip -9 -c "$DEPLOY_DIR/mediarr-card.js" > "$DEPLOY_DIR/mediarr-card.js.gz"
    echo "Deployed to $DEPLOY_DIR (js + gz)"
  fi
done
