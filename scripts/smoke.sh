#!/usr/bin/env bash
# Full smoke run: first launch exercises the app, second launch verifies persistence.
# Requires a display (Linux: xvfb-run) and a prior `npm run build`.
set -euo pipefail
OUT="${1:-/tmp/bvd-smoke}"
UD="$(mktemp -d)"
BVD_USER_DATA="$UD" node scripts/smoke-electron.mjs "$OUT"
BVD_USER_DATA="$UD" PERSIST_CHECK=1 node scripts/smoke-electron.mjs "$OUT/persist"
