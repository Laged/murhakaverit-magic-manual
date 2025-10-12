#!/usr/bin/env bash
set -eo pipefail

biome check src --write
bun run type-check
