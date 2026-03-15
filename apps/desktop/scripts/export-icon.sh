#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
desktop_dir="$(cd "$script_dir/.." && pwd)"
icon_svg="$desktop_dir/assets/icon.svg"
icon_png="$desktop_dir/assets/icon.png"

if ! command -v inkscape >/dev/null 2>&1; then
  echo "inkscape is required to export $icon_png from $icon_svg" >&2
  exit 1
fi

if [[ ! -f "$icon_svg" ]]; then
  echo "missing source icon: $icon_svg" >&2
  exit 1
fi

mkdir -p "$(dirname "$icon_png")"
inkscape "$icon_svg" \
  --export-type=png \
  --export-filename="$icon_png" \
  -w 512 \
  -h 512
