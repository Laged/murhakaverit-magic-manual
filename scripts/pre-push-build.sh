#!/usr/bin/env bash
set -eo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "pre-push build hook: bun not found in PATH" >&2
  exit 1
fi

bun run build
