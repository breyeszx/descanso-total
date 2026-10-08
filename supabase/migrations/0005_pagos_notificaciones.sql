-- Fase 4: notificaciones automáticas de pagos y avisos programados (RF10, RF12, RF23)

-- Pago aprobado => comprobante por correo
create or replace function public.pagos_notificar_aprobado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'aprobado' and (tg_op = 'INSERT' or old.estado is distinct from 'aprobado') then
    insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
    select 'comprobante_pago', c.email, 'Comprobante de pago · Reserva ' || r.codigo, r.id,
      jsonb_build_object('codigo', r.codigo, 'concepto', new.concepto, 'medio', new.medio, 'monto', new.monto,
                         'autorizacion', new.webpay_authorization_code, 'departamento', d.nombre,
                         'saldo', r.monto_total - r.monto_pagado)
    from public.reservas r join public.clientes c on c.id = r.cliente_id join public.departamentos d on d.id = r.departamento_id
    where r.id = new.reserva_id;
  end if;
  return new;
end;
$$;
create trigger pagos_notificar_aprobado after insert or update on public.pagos
  for each row execute function public.pagos_notificar_aprobado();

-- Encola avisos programados (idempotente): coordinación de transporte 48h antes de la llegada
-- y recordatorio 24h antes del check-out. Devuelve cuántos encoló.
create or replace function public.encolar_notificaciones_programadas() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_hoy date := (now() at time zone 'America/Santiago')::date;
  v_h_llegada int := public.config_num('horas_aviso_transporte_llegada', 48)::int;
  v_h_checkout int := public.config_num('horas_aviso_checkout', 24)::int;
  v_n int := 0;
  r record;
begin
  -- Llegadas dentro de la ventana de aviso
  for r in
    select rs.id, rs.codigo, rs.fecha_inicio, c.email, d.nombre as departamento, d.direccion,
      (select jsonb_agg(jsonb_build_object('tipo', t.tipo, 'fecha_hora', t.fecha_hora, 'origen', t.origen, 'destino', t.destino,
                                            'vehiculo', v.patente, 'conductor', co.nombre, 'telefono', co.telefono))
         from public.transportes t left join public.vehiculos v on v.id = t.vehiculo_id left join public.conductores co on co.id = t.conductor_id
        where t.reserva_id = rs.id and t.estado <> 'cancelado') as transportes
    from public.reservas rs join public.clientes c on c.id = rs.cliente_id join public.departamentos d on d.id = rs.departamento_id
    where rs.estado = 'confirmada'
      and rs.fecha_inicio between v_hoy and v_hoy + ceil(v_h_llegada / 24.0)::int
      and not exists (select 1 from public.notificaciones n where n.reserva_id = rs.id and n.tipo = 'coordinacion_transporte')
  loop
    insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
    values ('coordinacion_transporte', r.email, 'Coordinación de tu llegada · ' || r.codigo, r.id,
      jsonb_build_object('codigo', r.codigo, 'fecha_inicio', r.fecha_inicio, 'departamento', r.departamento, 'direccion', r.direccion,
                         'hora_checkin', (select valor #>> '{}' from public.configuracion where clave = 'hora_checkin'),
                         'transportes', coalesce(r.transportes, '[]'::jsonb)));
    update public.transportes set correo_enviado_at = now() where reserva_id = r.id and correo_enviado_at is null;
    v_n := v_n + 1;
  end loop;

  -- Check-outs dentro de la ventana de aviso
  for r in
    select rs.id, rs.codigo, rs.fecha_fin, rs.monto_total - rs.monto_pagado as saldo, c.email, d.nombre as departamento
    from public.reservas rs join public.clientes c on c.id = rs.cliente_id join public.departamentos d on d.id = rs.departamento_id
    where rs.estado = 'en_curso'
      and rs.fecha_fin between v_hoy and v_hoy + ceil(v_h_checkout / 24.0)::int
      and not exists (select 1 from public.notificaciones n where n.reserva_id = rs.id and n.tipo = 'recordatorio_checkout')
  loop
    insert into public.notificaciones (tipo, destinatario, asunto, reserva_id, payload)
    values ('recordatorio_checkout', r.email, 'Tu check-out es pronto · ' || r.codigo, r.id,
      jsonb_build_object('codigo', r.codigo, 'fecha_fin', r.fecha_fin, 'departamento', r.departamento, 'saldo', r.saldo,
                         'hora_checkout', (select valor #>> '{}' from public.configuracion where clave = 'hora_checkout')));
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- Vista de reservas para el panel (evita joins repetidos en la app)
create or replace view public.vw_reservas with (security_invoker = true) as
select r.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.email as cliente_email, c.telefono as cliente_telefono, c.rut as cliente_rut,
       d.nombre as departamento_nombre, d.codigo as departamento_codigo, z.nombre as zona_nombre
from public.reservas r
join public.clientes c on c.id = r.cliente_id
join public.departamentos d on d.id = r.departamento_id
join public.zonas z on z.id = d.zona_id;
