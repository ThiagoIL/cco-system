#!/bin/sh
set -e

echo "==> Aplicando migrations pendentes do banco de dados..."
npx prisma migrate deploy

echo "==> Iniciando aplicação..."
exec "$@"
