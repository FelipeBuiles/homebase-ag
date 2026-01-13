#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS=()
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"

cleanup() {
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT

start() {
  local name="$1"
  shift
  echo "Starting ${name}..."
  "$@" &
  PIDS+=("$!")
}

cd "$ROOT_DIR"

if command -v nc >/dev/null 2>&1; then
  if ! nc -z "$REDIS_HOST" "$REDIS_PORT"; then
    echo "Redis is not reachable at ${REDIS_HOST}:${REDIS_PORT}."
    echo "Start Redis (or docker compose) before running agents."
    exit 1
  fi
else
  echo "Warning: nc not found; skipping Redis connectivity check."
fi

start "Next.js dev server" npm run dev
start "Enrichment agent" npm run agent:enrichment
start "Normalization agent" npm run agent:normalization
start "Recipe parser agent" npm run agent:recipe
start "Expiration agent" npm run agent:expiration
start "Chef agent" npm run agent:chef

wait
