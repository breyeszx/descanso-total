-- Fase 3: operaciones de reserva del portal (RF06, RF08, RF11, RF17, RF23)

-- Crea una reserva con sus servicios extra en una sola transacción.
-- p_servicios: [{"servicio_id": 1, "cantidad": 2}, ...]
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

  for s in select (e ->> 'servicio_id')::bigint as servicio_id, greatest(coalesce((e ->> 'cantidad')::int, 1), 1) as cantidad
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

-- Cancela una reserva aplicando la política de plazos (RF17).
create or replace function public.cancelar_reserva(p_reserva bigint, p_motivo text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  r public.reservas;
  v_hoy date := (now() at time zone 'America/Santiago')::date;
  v_dias int := public.config_num('dias_cancelacion_sin_costo', 7)::int;
  v_pct numeric := public.config_num('porcentaje_multa_cancelacion', 100);
  v_multa numeric;
begin
  select * into r from public.reservas where id = p_reserva;
  if r is null then raise exception 'Reserva no encontrada' using errcode = 'P0001'; end if;
  if not (public.es_staff() or r.cliente_id = public.cliente_actual_id()) then
    raise exception 'No tienes permiso sobre esta reserva' using errcode = 'P0001';
  end if;
  if r.estado not in ('pendiente_pago', 'confirmada') then
    raise exception 'La reserva no se puede cancelar en su estado actual' using errcode = 'P0001';
  end if;

  -- Multa: solo si ya pagó y cancela fuera del plazo sin costo
  if r.monto_pagado > 0 and (r.fecha_inicio - v_hoy) < v_dias then
    v_multa := round(least(r.monto_anticipo, r.monto_pagado) * v_pct / 100);
    if v_multa > 0 then
      insert into public.reserva_cargos (reserva_id, tipo, descripcion, monto, registrado_por)
      values (p_reserva, 'multa', 'Multa por cancelación fuera de plazo (' || v_dias || ' días)', v_multa, auth.uid());
    end if;
  end if;

  update public.reservas set estado = 'cancelada', motivo_cancelacion = p_motivo, cancelada_at = now() where id = p_reserva;

  insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
  select 'cancelacion_reserva', c.email, 'Reserva ' || r.codigo || ' cancelada', r.id,
         jsonb_build_object('codigo', r.codigo, 'multa', coalesce(v_multa, 0))
  from public.clientes c where c.id = r.cliente_id;
end;
$$;

-- Reprograma fechas (RF17). El trigger recalcula el arriendo y la exclusión evita solapes.
create or replace function public.modificar_reserva(p_reserva bigint, p_inicio date, p_fin date, p_huespedes int default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  r public.reservas;
  v_hoy date := (now() at time zone 'America/Santiago')::date;
  v_dias int := public.config_num('dias_cancelacion_sin_costo', 7)::int;
begin
  select * into r from public.reservas where id = p_reserva;
  if r is null then raise exception 'Reserva no encontrada' using errcode = 'P0001'; end if;
  if not (public.es_staff() or r.cliente_id = public.cliente_actual_id()) then
    raise exception 'No tienes permiso sobre esta reserva' using errcode = 'P0001';
  end if;
  if r.estado not in ('pendiente_pago', 'confirmada') then
    raise exception 'La reserva no se puede modificar en su estado actual' using errcode = 'P0001';
  end if;
  if not public.es_staff() and (r.fecha_inicio - v_hoy) < v_dias then
    raise exception 'Solo puedes reprogramar con al menos % días de anticipación', v_dias using errcode = 'P0001';
  end if;
  if p_inicio < v_hoy or p_fin <= p_inicio then raise exception 'Fechas inválidas' using errcode = 'P0001'; end if;
  if not exists (
    select 1 from public.departamentos d
    where d.id = r.departamento_id and d.capacidad_max >= coalesce(p_huespedes, r.num_huespedes)
      and not exists (select 1 from public.reservas x where x.departamento_id = d.id and x.id <> p_reserva
                      and x.estado not in ('cancelada', 'no_show') and daterange(x.fecha_inicio, x.fecha_fin, '[)') && daterange(p_inicio, p_fin, '[)'))
      and not public.mantencion_solapa(d.id, p_inicio, p_fin)
  ) then
    raise exception 'El departamento no está disponible en las nuevas fechas' using errcode = 'P0001';
  end if;
  update public.reservas set fecha_inicio = p_inicio, fecha_fin = p_fin, num_huespedes = coalesce(p_huespedes, num_huespedes) where id = p_reserva;
end;
$$;

-- Presupuesto previo para la pantalla de reserva (sin crear nada)
create or replace function public.cotizar_reserva(p_departamento bigint, p_inicio date, p_fin date)
returns table (noches int, monto_arriendo numeric, monto_anticipo numeric, disponible boolean)
language sql stable set search_path = public as $$
  select (p_fin - p_inicio),
         public.calcular_arriendo(p_departamento, p_inicio, p_fin),
         round(public.calcular_arriendo(p_departamento, p_inicio, p_fin) * public.config_num('porcentaje_anticipo', 30) / 100),
         exists (select 1 from public.departamentos_disponibles(p_inicio, p_fin) d where d.id = p_departamento);
$$;
