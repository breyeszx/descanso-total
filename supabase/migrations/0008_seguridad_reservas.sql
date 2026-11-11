-- Cierre de huecos de seguridad en reservas y vencimiento de reservas sin pagar

-- 1) El cliente ya no escribe directo en reservas ni en reserva_servicios: todo pasa por crear_reserva()
--    (security definer), que valida fechas, capacidad y disponibilidad y toma el precio del catálogo.
--    Antes un cliente podía insertar por la API un servicio con precio arbitrario (incluso negativo).
drop policy if exists "cliente crea reserva propia" on public.reservas;
drop policy if exists "cliente contrata servicios" on public.reserva_servicios;

alter table public.reserva_servicios
  add constraint reserva_servicios_precio_no_negativo check (precio_unitario >= 0) not valid;
alter table public.reserva_servicios validate constraint reserva_servicios_precio_no_negativo;

-- 2) Vencimiento de reservas pendientes de pago
insert into public.configuracion (clave, valor, descripcion) values
  ('horas_expiracion_reserva', '24', 'Horas que una reserva puede estar pendiente de pago antes de liberarse'),
  ('max_reservas_pendientes', '3', 'Máximo de reservas pendientes de pago simultáneas por cliente')
on conflict (clave) do nothing;

-- ¿La reserva está pendiente, sin ningún pago, y ya pasó su plazo?
create or replace function public.reserva_vencida(p_estado public.estado_reserva, p_pagado numeric, p_creada timestamptz)
returns boolean language sql stable set search_path = public as $$
  select p_estado = 'pendiente_pago' and p_pagado = 0
     and p_creada < now() - make_interval(hours => public.config_num('horas_expiracion_reserva', 24)::int);
$$;

-- Cancela las reservas vencidas y avisa al cliente. No toca las que tienen un pago Webpay en curso.
create or replace function public.expirar_reservas_pendientes() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_horas int := public.config_num('horas_expiracion_reserva', 24)::int;
  v_n int := 0;
  r record;
begin
  for r in
    select rs.id, rs.codigo, c.email
    from public.reservas rs join public.clientes c on c.id = rs.cliente_id
    where public.reserva_vencida(rs.estado, rs.monto_pagado, rs.created_at)
      and not exists (select 1 from public.pagos p where p.reserva_id = rs.id and p.estado = 'pendiente' and p.created_at > now() - interval '1 hour')
    for update of rs skip locked
  loop
    update public.reservas
      set estado = 'cancelada', cancelada_at = now(),
          motivo_cancelacion = 'Venció el plazo de ' || v_horas || ' horas para pagar el anticipo'
      where id = r.id;
    update public.pagos set estado = 'anulado', notas = 'Reserva vencida' where reserva_id = r.id and estado = 'pendiente';
    insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
    values ('cancelacion_reserva', r.email, 'Reserva ' || r.codigo || ' cancelada por falta de pago', r.id,
            jsonb_build_object('codigo', r.codigo, 'multa', 0, 'vencida', true));
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke execute on function public.expirar_reservas_pendientes() from public, anon, authenticated;
grant execute on function public.expirar_reservas_pendientes() to service_role;

-- El buscador ya no considera ocupado un departamento cuya única reserva está vencida
create or replace function public.departamentos_disponibles(p_inicio date, p_fin date, p_zona bigint default null, p_huespedes int default 1)
returns setof public.departamentos language sql stable set search_path = public as $$
  select d.* from public.departamentos d
  where d.activo
    and (p_zona is null or d.zona_id = p_zona)
    and d.capacidad_max >= p_huespedes
    and not exists (
      select 1 from public.reservas r
      where r.departamento_id = d.id and r.estado not in ('cancelada', 'no_show')
        and not public.reserva_vencida(r.estado, r.monto_pagado, r.created_at)
        and daterange(r.fecha_inicio, r.fecha_fin, '[)') && daterange(p_inicio, p_fin, '[)'))
    and not public.mantencion_solapa(d.id, p_inicio, p_fin)
  order by d.zona_id, d.nombre;
$$;

-- crear_reserva: libera las vencidas antes de validar y limita las pendientes por cliente
create or replace function public.crear_reserva(
  p_departamento bigint,
  p_inicio date,
  p_fin date,
  p_huespedes int default 1,
  p_servicios jsonb default '[]',
  p_notas text default null,
  p_cliente bigint default null -- solo staff puede indicar otro cliente (reserva presencial)
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_cliente bigint;
  v_origen public.origen_reserva := 'web';
  v_reserva bigint;
  v_dep public.departamentos;
  v_max int := public.config_num('max_reservas_pendientes', 3)::int;
  s record;
begin
  if p_cliente is not null and public.es_staff() then
    v_cliente := p_cliente; v_origen := 'presencial';
  else
    v_cliente := public.cliente_actual_id();
  end if;
  if v_cliente is null then raise exception 'Debes iniciar sesión para reservar' using errcode = 'P0001'; end if;
  if p_inicio < (now() at time zone 'America/Santiago')::date then raise exception 'La fecha de llegada ya pasó' using errcode = 'P0001'; end if;
  if p_fin <= p_inicio then raise exception 'La fecha de salida debe ser posterior a la de llegada' using errcode = 'P0001'; end if;

  perform public.expirar_reservas_pendientes();

  if v_origen = 'web' and (select count(*) from public.reservas where cliente_id = v_cliente and estado = 'pendiente_pago') >= v_max then
    raise exception 'Tienes % reservas pendientes de pago. Paga o cancela alguna antes de crear otra', v_max using errcode = 'P0001';
  end if;

  select * into v_dep from public.departamentos where id = p_departamento and activo;
  if v_dep is null then raise exception 'Departamento no disponible' using errcode = 'P0001'; end if;
  if p_huespedes > v_dep.capacidad_max then
    raise exception 'El departamento admite máximo % huéspedes', v_dep.capacidad_max using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.departamentos_disponibles(p_inicio, p_fin, null, p_huespedes) d where d.id = p_departamento) then
    raise exception 'El departamento no está disponible en esas fechas' using errcode = 'P0001';
  end if;

  insert into public.reservas (cliente_id, departamento_id, fecha_inicio, fecha_fin, num_huespedes, origen, notas)
  values (v_cliente, p_departamento, p_inicio, p_fin, p_huespedes, v_origen, p_notas)
  returning id into v_reserva;

  for s in select (e ->> 'servicio_id')::bigint as servicio_id, least(greatest(coalesce((e ->> 'cantidad')::int, 1), 1), 50) as cantidad
           from jsonb_array_elements(coalesce(p_servicios, '[]')) e
  loop
    insert into public.reserva_servicios (reserva_id, servicio_id, cantidad, precio_unitario)
    select v_reserva, sv.id, s.cantidad, sv.precio from public.servicios sv where sv.id = s.servicio_id and sv.activo;
  end loop;

  insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
  select 'confirmacion_reserva', c.email, 'Recibimos tu reserva ' || r.codigo, r.id,
         jsonb_build_object('codigo', r.codigo, 'departamento', v_dep.nombre, 'inicio', r.fecha_inicio, 'fin', r.fecha_fin, 'anticipo', r.monto_anticipo)
  from public.reservas r join public.clientes c on c.id = r.cliente_id where r.id = v_reserva;

  return v_reserva;
end;
$$;

-- El cron diario también libera las vencidas antes de encolar avisos
create or replace function public.encolar_y_expirar() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return jsonb_build_object('expiradas', public.expirar_reservas_pendientes(), 'encoladas', public.encolar_notificaciones_programadas());
end;
$$;
revoke execute on function public.encolar_y_expirar() from public, anon, authenticated;
grant execute on function public.encolar_y_expirar() to service_role;

-- 3) Fotos de departamentos: el navegador sube directo al bucket (las Server Actions cortan en 1 MB),
--    así que el límite de tamaño y tipo se aplica en Storage.
update storage.buckets
  set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'departamentos';
