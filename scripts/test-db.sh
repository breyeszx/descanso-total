#!/usr/bin/env bash
# Prueba las reglas de negocio en la base real dentro de una transacción que se revierte (no deja datos).
set -euo pipefail
cd "$(dirname "$0")/.."
PSQL="${PSQL:-/c/Program Files/PostgreSQL/18/bin/psql.exe}"
DB=$(grep ^SUPABASE_DB_URL= .env.local | cut -d= -f2- | tr -d '\r')

OUT=$("$PSQL" "$DB" -Atq -v ON_ERROR_STOP=0 <<'SQL' 2>&1
begin;
set local role postgres;
insert into clientes (nombre, email, rut) values ('QA', 'qa@test.cl', '22222222-2');
insert into reservas (cliente_id, departamento_id, fecha_inicio, fecha_fin) values ((select id from clientes where rut='22222222-2'), 9, '2030-03-10', '2030-03-13');
select 'T1 anticipo=' || monto_anticipo || ' arriendo=' || monto_arriendo from reservas where departamento_id=9 and fecha_inicio='2030-03-10';
savepoint a;
insert into reservas (cliente_id, departamento_id, fecha_inicio, fecha_fin) values ((select id from clientes where rut='22222222-2'), 9, '2030-03-12', '2030-03-15');
rollback to a;
savepoint b;
insert into mantenciones (departamento_id, titulo, fecha_inicio, fecha_fin) values (9, 'QA', '2030-03-11', '2030-03-11');
rollback to b;
insert into pagos (reserva_id, concepto, medio, monto, estado) select id, 'anticipo', 'efectivo', monto_anticipo, 'aprobado' from reservas where departamento_id=9 and fecha_inicio='2030-03-10';
select 'T4 estado=' || estado from reservas where departamento_id=9 and fecha_inicio='2030-03-10';
select 'T5 disponibles=' || count(*) from departamentos_disponibles('2030-03-10','2030-03-13') where id=9;
insert into reservas (cliente_id, departamento_id, fecha_inicio, fecha_fin, created_at) values ((select id from clientes where rut='22222222-2'), 8, '2030-04-01', '2030-04-03', now() - interval '2 days');
select 'T6 vencida_libre=' || count(*) from departamentos_disponibles('2030-04-01','2030-04-03') where id=8;
select 'T7 expiradas>=1 ' || (expirar_reservas_pendientes() >= 1);
select 'T8 estado=' || estado from reservas where departamento_id=8 and fecha_inicio='2030-04-01';
rollback;
SQL
)
echo "$OUT"
check() { echo "$OUT" | grep -q "$1" && echo "OK  $2" || { echo "FAIL $2"; exit 1; }; }
check "T1 anticipo=72000 arriendo=240000" "cálculo de arriendo (3 noches x 80.000) y anticipo 30%"
check "reservas_sin_solape" "anti-overbooking rechaza solape"
check "reservas activas en el rango" "mantención rechazada sobre reserva activa"
check "T4 estado=confirmada" "pago del anticipo confirma la reserva"
check "T5 disponibles=0" "departamento reservado no aparece disponible"
check "T6 vencida_libre=1" "reserva vencida sin pago no bloquea la búsqueda"
check "T7 expiradas>=1 true" "vencimiento cancela reservas sin pago"
check "T8 estado=cancelada" "reserva vencida queda cancelada"
echo "Reglas de negocio OK"
