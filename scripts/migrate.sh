#!/usr/bin/env bash
# Aplica en orden las migraciones pendientes de supabase/migrations usando SUPABASE_DB_URL de .env.local
set -euo pipefail
cd "$(dirname "$0")/.."
PSQL="${PSQL:-/c/Program Files/PostgreSQL/18/bin/psql.exe}"
DB=$(grep ^SUPABASE_DB_URL= .env.local | cut -d= -f2- | tr -d '\r')
run() { "$PSQL" "$DB" -v ON_ERROR_STOP=1 -Atq "$@"; }
run -c "create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now());"
run -c "alter table public._migrations enable row level security;"
for f in supabase/migrations/*.sql; do
  n=$(basename "$f")
  if [ "$(run -c "select 1 from public._migrations where name='$n'")" = "1" ]; then continue; fi
  echo "Aplicando $n"
  run -1 -f "$f" -c "insert into public._migrations(name) values ('$n');"
done
echo "Migraciones al día"
