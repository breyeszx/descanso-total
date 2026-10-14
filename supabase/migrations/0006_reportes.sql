-- Fase 7: reportería (RF20, RF21). Solo staff puede ejecutar estas funciones.

-- Noches ocupadas de un departamento dentro de un rango (reservas confirmadas, en curso o finalizadas)
create or replace function public.noches_ocupadas(p_departamento bigint, p_desde date, p_hasta date) returns int
language sql stable set search_path = public as $$
  select coalesce(sum(greatest(0, least(r.fecha_fin, p_hasta + 1) - greatest(r.fecha_inicio, p_desde))), 0)::int
  from public.reservas r
  where r.departamento_id = p_departamento and r.estado in ('confirmada', 'en_curso', 'finalizada')
    and r.fecha_inicio <= p_hasta and r.fecha_fin > p_desde;
$$;

-- Resumen por departamento (ingresos/egresos por fecha de movimiento, ocupación por noches)
create or replace function public.reporte_departamentos(p_desde date, p_hasta date)
returns table (departamento_id bigint, codigo text, departamento text, zona text, reservas bigint, noches int, ocupacion numeric, ingresos numeric, egresos numeric)
language sql stable security definer set search_path = public as $$
  select d.id, d.codigo, d.nombre, z.nombre,
    (select count(*) from public.reservas r where r.departamento_id = d.id and r.estado in ('confirmada','en_curso','finalizada') and r.fecha_inicio between p_desde and p_hasta),
    public.noches_ocupadas(d.id, p_desde, p_hasta),
    round(public.noches_ocupadas(d.id, p_desde, p_hasta)::numeric * 100 / greatest(p_hasta - p_desde + 1, 1), 1),
    coalesce((select sum(monto) from public.movimientos_financieros m where m.departamento_id = d.id and m.tipo = 'ingreso' and m.fecha between p_desde and p_hasta), 0),
    coalesce((select sum(monto) from public.movimientos_financieros m where m.departamento_id = d.id and m.tipo = 'egreso' and m.fecha between p_desde and p_hasta), 0)
  from public.departamentos d join public.zonas z on z.id = d.zona_id
  where public.es_staff()
  order by z.nombre, d.codigo;
$$;

-- Servicios más contratados (reservas con llegada en el período)
create or replace function public.reporte_servicios(p_desde date, p_hasta date)
returns table (servicio text, tipo public.tipo_servicio, cantidad bigint, monto numeric)
language sql stable security definer set search_path = public as $$
  select s.nombre, s.tipo, sum(rs.cantidad), sum(rs.subtotal)
  from public.reserva_servicios rs join public.servicios s on s.id = rs.servicio_id join public.reservas r on r.id = rs.reserva_id
  where public.es_staff() and rs.estado <> 'cancelado' and r.estado not in ('cancelada','no_show') and r.fecha_inicio between p_desde and p_hasta
  group by s.nombre, s.tipo order by sum(rs.subtotal) desc;
$$;

-- Temporadas: ingresos, egresos y noches por mes de un año
create or replace function public.reporte_mensual(p_anio int)
returns table (mes int, ingresos numeric, egresos numeric, noches int, ocupacion numeric)
language sql stable security definer set search_path = public as $$
  with meses as (select generate_series(1, 12) as mes),
  deps as (select count(*) as n from public.departamentos where activo)
  select m.mes,
    coalesce((select sum(monto) from public.movimientos_financieros f where f.tipo='ingreso' and extract(year from f.fecha) = p_anio and extract(month from f.fecha) = m.mes), 0),
    coalesce((select sum(monto) from public.movimientos_financieros f where f.tipo='egreso' and extract(year from f.fecha) = p_anio and extract(month from f.fecha) = m.mes), 0),
    (select coalesce(sum(public.noches_ocupadas(d.id, make_date(p_anio, m.mes, 1), (make_date(p_anio, m.mes, 1) + interval '1 month - 1 day')::date)), 0) from public.departamentos d where d.activo)::int,
    round((select coalesce(sum(public.noches_ocupadas(d.id, make_date(p_anio, m.mes, 1), (make_date(p_anio, m.mes, 1) + interval '1 month - 1 day')::date)), 0) from public.departamentos d where d.activo)::numeric * 100
      / greatest((select n from deps) * extract(day from (make_date(p_anio, m.mes, 1) + interval '1 month - 1 day'))::int, 1), 1)
  from meses m where public.es_staff() order by m.mes;
$$;
