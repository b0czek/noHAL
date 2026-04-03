#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/diagrams-src"
OUT_DIR="$ROOT_DIR/public/diagrams"
D2_BIN="${D2_BIN:-$HOME/.local/bin/d2}"

if [[ ! -x "$D2_BIN" ]]; then
  echo "D2 binary not found at $D2_BIN" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

for source in "$SRC_DIR"/*.d2; do
  name="$(basename "$source" .d2)"
  "$D2_BIN" "$source" "$OUT_DIR/$name.svg"
done
