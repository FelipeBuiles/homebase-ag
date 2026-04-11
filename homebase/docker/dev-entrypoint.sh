#!/bin/sh
set -eu

if [ ! -d /app/node_modules ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
  rm -rf /app/node_modules
  mkdir -p /app/node_modules
  cp -R /opt/homebase-node_modules/. /app/node_modules
fi

npx prisma generate >/dev/null
npx prisma migrate deploy >/dev/null

exec "$@"
