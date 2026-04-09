#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env.test"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.test at $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for tests" >&2
  exit 1
fi

if [[ "$DATABASE_URL" != *"_test"* ]]; then
  echo "Refusing to run tests against non-test database: $DATABASE_URL" >&2
  exit 1
fi

export NODE_ENV=test

npx prisma migrate deploy --schema "$ROOT_DIR/prisma/schema.prisma"

exec npx vitest run "$@"
