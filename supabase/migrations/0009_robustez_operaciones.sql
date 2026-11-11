-- Robustez: actas atómicas, pagos Webpay sin duplicados, tope de reembolsos, inventario atómico,
-- reintentos de correo y fichas de clientes editables solo por admin.

-- =====================================================================
-- 1) PAGOS
-- =====================================================================
-- Un solo pago Webpay pendiente por reserva. Antes se anulan los duplicados existentes (queda el más reciente).
update public.pagos p set estado = 'anulado', notas = 'Anulado: pago Webpay duplicado o abandonado'
where p.estado = 'pendiente' and p.medio = 'webpay'
  and (p.created_at < now() - interval '1 hour'
       or exists (select 1 from public.pagos q where q.reserva_id = p.reserva_id and q.estado = 'pendiente' and q.medio = 'webpay' and q.id > p.id));
create unique index pagos_un_webpay_pendiente on public.pagos (reserva_id) where estado = 'pendiente' and medio = 'webpay';

-- Un reembolso no puede superar lo que la reserva tiene pagado
create or replace function public.pagos_validar_reembolso() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_pagado numeric;
begin
  if new.concepto = 'reembolso' and new.estado = 'aprobado' and (tg_op = 'INSERT' or old.estado is distinct from 'aprobado') then
    select monto_pagado into v_pagado from public.reservas where id = new.reserva_id for update;
    if new.monto > coalesce(v_pagado, 0) then
      raise exception 'El reembolso no puede superar lo pagado por la reserva ($%)', coalesce(v_pagado, 0) using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger pagos_validar_reembolso before insert or update on public.pagos
  for each row execute function public.pagos_validar_reembolso();

-- =====================================================================
-- 2) NOTIFICACIONES: contador de intentos para reintentar las fallidas
-- =====================================================================
alter table public.notificaciones add column if not exists intentos int not null default 0;

-- =====================================================================
-- 3) CLIENTES: el funcionario solo lee; la ficha la edita el admin (o el propio cliente)
-- =====================================================================
drop policy if exists "staff gestiona clientes" on public.clientes;
create policy "staff lee clientes" on public.clientes for select using ((select public.es_staff()));
create policy "admin gestiona clientes" on public.clientes for all using ((select public.es_admin()));

-- =====================================================================
-- 4) ACTA DE CHECK-IN / CHECK-OUT EN UNA SOLA TRANSACCIÓN (RF13-RF16)
--    Cobro, acta, cargos por daños, movimientos de inventario y multa: o se guarda todo o nada.
--    p_checklist: [{"item_id": 1, "nombre": "...", "estado": "bueno|danado|faltante", "observacion": "...", "cargo": 0}]
-- =====================================================================
create or replace function public.registrar_acta(
  p_reserva bigint,
  p_tipo public.tipo_acta,
  p_checklist jsonb default '[]',
  p_observaciones text default null,
  p_conformidad boolean default false,
  p_cobro_monto numeric default 0,
  p_cobro_medio public.medio_pago default 'efectivo',
  p_multa_monto numeric default 0,
  p_multa_descripcion text default null
) returns bigint
language plpgsql set search_path = public as $$
declare
  r public.reservas;
  v_acta bigint;
  v_cobro numeric := 0;
  v_saldo numeric;
  v_hay_cargos boolean := false;
  v_desc text;
  c record;
begin
  if not public.es_staff() then raise exception 'No tienes permiso para registrar actas' using errcode = 'P0001'; end if;
  select * into r from public.reservas where id = p_reserva for update;
  if r is null then raise exception 'Reserva no encontrada' using errcode = 'P0001'; end if;

  if p_tipo = 'check_in' then
    if r.estado not in ('confirmada', 'pendiente_pago') then
      raise exception 'La reserva no admite check-in en su estado actual (%)', r.estado using errcode = 'P0001';
    end if;
    if not coalesce(p_conformidad, false) then
      raise exception 'El cliente debe firmar conformidad para entregar el departamento' using errcode = 'P0001';
    end if;
    v_cobro := least(greatest(coalesce(p_cobro_monto, 0), 0), greatest(r.saldo_pendiente, 0));
    if v_cobro > 0 then
      insert into public.pagos (reserva_id, concepto, medio, monto, estado, pagado_at, registrado_por, notas)
      values (p_reserva, (case when r.estado = 'pendiente_pago' then 'anticipo' else 'saldo' end)::public.concepto_pago,
              p_cobro_medio, v_cobro, 'aprobado', now(), auth.uid(), 'Cobrado en check-in');
    end if;
    -- El trigger del acta pasa la reserva a en_curso
    insert into public.actas (reserva_id, tipo, funcionario_id, checklist, observaciones, firma_conformidad, monto_cobrado)
    values (p_reserva, 'check_in', auth.uid(), coalesce(p_checklist, '[]'), p_observaciones, true, v_cobro)
    returning id into v_acta;
    return v_acta;
  end if;

  -- check_out
  if r.estado <> 'en_curso' then
    raise exception 'La reserva no admite check-out en su estado actual (%)', r.estado using errcode = 'P0001';
  end if;
  -- El trigger del acta finaliza la reserva
  insert into public.actas (reserva_id, tipo, funcionario_id, checklist, observaciones, firma_conformidad, monto_cobrado)
  values (p_reserva, 'check_out', auth.uid(), coalesce(p_checklist, '[]'), p_observaciones, coalesce(p_conformidad, false), 0)
  returning id into v_acta;

  for c in
    select (e ->> 'item_id')::bigint as item_id, e ->> 'nombre' as nombre, e ->> 'estado' as estado,
           nullif(trim(e ->> 'observacion'), '') as observacion, coalesce((e ->> 'cargo')::numeric, 0) as cargo
    from jsonb_array_elements(coalesce(p_checklist, '[]')) e
  loop
    continue when c.cargo <= 0;
    if c.item_id is not null and not exists (select 1 from public.inventario_items i where i.id = c.item_id and i.departamento_id = r.departamento_id) then
      raise exception 'El ítem % no pertenece al departamento de la reserva', c.item_id using errcode = 'P0001';
    end if;
    v_desc := (case when c.estado = 'faltante' then 'Faltante: ' else 'Daño: ' end) || coalesce(c.nombre, 'ítem')
              || coalesce(' (' || c.observacion || ')', '');
    insert into public.reserva_cargos (reserva_id, acta_id, inventario_item_id, tipo, descripcion, monto, registrado_por)
    values (p_reserva, v_acta, c.item_id, 'dano', v_desc, c.cargo, auth.uid());
    if c.item_id is not null then
      insert into public.inventario_movimientos (item_id, tipo, cantidad, costo, descripcion, reserva_id, registrado_por)
      values (c.item_id, (case when c.estado = 'faltante' then 'baja' else 'deterioro' end)::public.tipo_movimiento_inventario,
              1, 0, 'Check-out ' || r.codigo, p_reserva, auth.uid());
      update public.inventario_items
        set estado = (case when c.estado = 'faltante' then 'baja' else 'deteriorado' end)::public.estado_item
        where id = c.item_id;
    end if;
    v_hay_cargos := true;
  end loop;

  if coalesce(p_multa_monto, 0) > 0 then
    insert into public.reserva_cargos (reserva_id, acta_id, tipo, descripcion, monto, registrado_por)
    values (p_reserva, v_acta, 'multa', 'Multa: ' || coalesce(nullif(trim(p_multa_descripcion), ''), 'sin detalle'), p_multa_monto, auth.uid());
    v_hay_cargos := true;
  end if;

  -- Cobro final sobre el saldo ya actualizado por los cargos
  select saldo_pendiente into v_saldo from public.reservas where id = p_reserva;
  v_cobro := least(greatest(coalesce(p_cobro_monto, 0), 0), greatest(v_saldo, 0));
  if v_cobro > 0 then
    insert into public.pagos (reserva_id, concepto, medio, monto, estado, pagado_at, registrado_por, notas)
    values (p_reserva, (case when v_hay_cargos then 'cargo' else 'saldo' end)::public.concepto_pago,
            p_cobro_medio, v_cobro, 'aprobado', now(), auth.uid(), 'Cobrado en check-out');
    update public.actas set monto_cobrado = v_cobro where id = v_acta;
  end if;
  return v_acta;
end;
$$;

-- =====================================================================
-- 5) MOVIMIENTO DE INVENTARIO ATÓMICO (RF04)
-- =====================================================================
create or replace function public.registrar_movimiento_inventario(
  p_item bigint,
  p_tipo public.tipo_movimiento_inventario,
  p_cantidad int,
  p_costo numeric default 0,
  p_descripcion text default null
) returns bigint
language plpgsql set search_path = public as $$
declare
  i public.inventario_items;
  v_cantidad int;
begin
  if not public.es_admin() then raise exception 'No tienes permiso para modificar el inventario' using errcode = 'P0001'; end if;
  select * into i from public.inventario_items where id = p_item for update;
  if i is null then raise exception 'Ítem no encontrado' using errcode = 'P0001'; end if;
  if coalesce(p_cantidad, 0) < 1 then raise exception 'La cantidad mínima es 1 unidad' using errcode = 'P0001'; end if;
  if p_tipo = 'baja' and p_cantidad > i.cantidad then
    raise exception 'No puedes dar de baja % unidades: el ítem tiene %', p_cantidad, i.cantidad using errcode = 'P0001';
  end if;

  insert into public.inventario_movimientos (item_id, tipo, cantidad, costo, descripcion, registrado_por)
  values (p_item, p_tipo, p_cantidad, coalesce(p_costo, 0), nullif(trim(p_descripcion), ''), auth.uid());

  v_cantidad := case p_tipo when 'alta' then i.cantidad + p_cantidad when 'baja' then i.cantidad - p_cantidad else i.cantidad end;
  update public.inventario_items
    set cantidad = v_cantidad,
        estado = (case when p_tipo = 'deterioro' then 'deteriorado' when p_tipo <> 'reparacion' and v_cantidad = 0 then 'baja' else 'bueno' end)::public.estado_item
    where id = p_item;

  if p_tipo = 'reparacion' and coalesce(p_costo, 0) > 0 then
    insert into public.movimientos_financieros (tipo, categoria, monto, descripcion, departamento_id, registrado_por)
    values ('egreso', 'reparacion', p_costo, 'Reparación: ' || i.nombre || coalesce(' – ' || nullif(trim(p_descripcion), ''), ''), i.departamento_id, auth.uid());
  end if;
  return i.departamento_id;
end;
$$;
