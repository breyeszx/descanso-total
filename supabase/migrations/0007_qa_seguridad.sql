-- Fase 8 (QA): cierre de funciones internas e índices en FKs consultadas

-- Solo el service role (cron / servidor) puede encolar avisos o recalcular reservas
revoke execute on function public.encolar_notificaciones_programadas() from anon, authenticated;
revoke execute on function public.recalcular_reserva(bigint) from anon, authenticated;

create index if not exists reserva_servicios_servicio_idx on public.reserva_servicios (servicio_id);
create index if not exists notificaciones_reserva_idx on public.notificaciones (reserva_id);
create index if not exists transportes_vehiculo_idx on public.transportes (vehiculo_id);
create index if not exists transportes_conductor_idx on public.transportes (conductor_id);
create index if not exists movimientos_reserva_idx on public.movimientos_financieros (reserva_id);
create index if not exists movimientos_mantencion_idx on public.movimientos_financieros (mantencion_id);
create index if not exists reserva_cargos_acta_idx on public.reserva_cargos (acta_id);
create index if not exists inventario_movimientos_reserva_idx on public.inventario_movimientos (reserva_id);
create index if not exists actas_reserva_idx on public.actas (reserva_id);
create index if not exists tarifas_temporada_dep_idx on public.tarifas_temporada (departamento_id);
