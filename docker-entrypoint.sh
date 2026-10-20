#!/bin/sh
set -e

echo "[entrypoint] aplicando migrations do banco..."
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] iniciando o servidor na porta ${PORT:-3000}..."
exec node server.js
