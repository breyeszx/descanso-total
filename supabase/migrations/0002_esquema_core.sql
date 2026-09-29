-- Fase 1: esquema completo del sistema "Descanso Total"
-- Basado en el modelo relacional de la ERS (Ilustración 6) y ampliado según RF01-RF23 / RNF09 / RNF15.

create extension if not exists btree_gist with schema extensions;

-- =====================================================================
-- ENUMS
-- =====================================================================
create type public.estado_departamento as enum ('disponible', 'reservado', 'ocupado', 'en_mantencion', 'inactivo');
create type public.estado_reserva as enum ('pendiente_pago', 'confirmada', 'en_curso', 'finalizada', 'cancelada', 'no_show');
create type public.origen_reserva as enum ('web', 'presencial');
create type public.concepto_pago as enum ('anticipo', 'saldo', 'servicio_extra', 'cargo', 'reembolso');
create type public.medio_pago as enum ('webpay', 'transferencia', 'efectivo');
create type public.estado_pago as enum ('pendiente', 'aprobado', 'rechazado', 'anulado');
create type public.tipo_servicio as enum ('tour', 'equipamiento', 'transporte', 'otro');
create type public.estado_reserva_servicio as enum ('pendiente', 'confirmado', 'realizado', 'cancelado');
create type public.tipo_transporte as enum ('llegada', 'salida', 'tour');
create type public.estado_transporte as enum ('programado', 'en_curso', 'completado', 'cancelado');
create type public.tipo_acta as enum ('check_in', 'check_out');
create type public.tipo_cargo as enum ('dano', 'multa', 'consumo', 'otro');
create type public.estado_item as enum ('bueno', 'deteriorado', 'en_reparacion', 'baja');
create type public.tipo_movimiento_inventario as enum ('alta', 'baja', 'deterioro', 'reparacion');
create type public.estado_mantencion as enum ('programada', 'en_curso', 'completada', 'cancelada');
create type public.tipo_movimiento as enum ('ingreso', 'egreso');
create type public.categoria_movimiento as enum ('arriendo', 'servicio_extra', 'cargo', 'reembolso', 'reparacion', 'mantencion', 'dividendo', 'contribucion', 'transporte', 'otro');
create type public.tipo_notificacion as enum ('confirmacion_reserva', 'comprobante_pago', 'coordinacion_transporte', 'recordatorio_checkout', 'alerta_mantencion', 'cancelacion_reserva');
create type public.estado_notificacion as enum ('pendiente', 'enviada', 'fallida');

-- =====================================================================
-- FUNCIONES AUXILIARES DE ROL
-- =====================================================================
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol from public.profiles where id = auth.uid()) = 'admin', false);
$$;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol from public.profiles where id = auth.uid()) in ('admin', 'funcionario'), false);
$$;

-- =====================================================================
-- CONFIGURACIÓN Y CATÁLOGOS
-- =====================================================================
create table public.configuracion (
  clave text primary key,
  valor jsonb not null,
  descripcion text,
  updated_at timestamptz not null default now()
);

create table public.zonas (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  region text,
  descripcion text,
  activa boolean not null default true
);

create table public.departamentos (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  nombre text not null,
  zona_id bigint not null references public.zonas (id),
  direccion text not null,
  descripcion text,
  capacidad_max int not null default 2 check (capacidad_max > 0),
  dormitorios int not null default 1,
  banos int not null default 1,
  tarifa_base numeric(12, 0) not null check (tarifa_base >= 0), -- CLP por noche
  amenidades text[] not null default '{}',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index departamentos_zona_idx on public.departamentos (zona_id);

create table public.departamento_fotos (
  id bigint generated always as identity primary key,
  departamento_id bigint not null references public.departamentos (id) on delete cascade,
  storage_path text not null,
  orden int not null default 0,
  es_portada boolean not null default false,
  created_at timestamptz not null default now()
);
create index departamento_fotos_dep_idx on public.departamento_fotos (departamento_id, orden);

create table public.tarifas_temporada (
  id bigint generated always as identity primary key,
  departamento_id bigint references public.departamentos (id) on delete cascade, -- null = aplica a todos
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  tarifa_noche numeric(12, 0) not null check (tarifa_noche >= 0),
  check (fecha_fin >= fecha_inicio)
);
create index tarifas_temporada_rango_idx on public.tarifas_temporada using gist (daterange(fecha_inicio, fecha_fin, '[]'));

create table public.servicios (
  id bigint generated always as identity primary key,
  nombre text not null,
  tipo public.tipo_servicio not null,
  descripcion text,
  precio numeric(12, 0) not null check (precio >= 0),
  duracion_horas numeric(5, 1),
  cupo_max int,
  requiere_transporte boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehiculos (
  id bigint generated always as identity primary key,
  patente text not null unique,
  marca text,
  modelo text,
  capacidad int not null default 4,
  activo boolean not null default true
);

create table public.conductores (
  id bigint generated always as identity primary key,
  nombre text not null,
  telefono text,
  licencia text,
  activo boolean not null default true
);

-- =====================================================================
-- CLIENTES (RF02): separados del usuario de auth; un cliente puede o no tener cuenta
-- =====================================================================
create table public.clientes (
  id bigint generated always as identity primary key,
  profile_id uuid unique references public.profiles (id) on delete set null,
  rut text unique,
  nombre text not null,
  apellido text,
  email text not null,
  telefono text,
  direccion text,
  pais text default 'Chile',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index clientes_email_idx on public.clientes (lower(email));

create or replace function public.cliente_actual_id() returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.clientes where profile_id = auth.uid();
$$;

-- Al registrarse un usuario se crea su perfil y su ficha de cliente (si no existe por email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_nombre text := coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, email, nombre) values (new.id, new.email, v_nombre);
  update public.clientes set profile_id = new.id where lower(email) = lower(new.email) and profile_id is null;
  if not found then
    insert into public.clientes (profile_id, nombre, email) values (new.id, v_nombre, new.email);
  end if;
  return new;
end;
$$;

-- =====================================================================
-- INVENTARIO VALORIZADO (RF04)
-- =====================================================================
create table public.inventario_items (
  id bigint generated always as identity primary key,
  departamento_id bigint not null references public.departamentos (id) on delete cascade,
  nombre text not null,
  categoria text,
  descripcion text,
  cantidad int not null default 1 check (cantidad >= 0),
  valor_unitario numeric(12, 0) not null default 0 check (valor_unitario >= 0),
  estado public.estado_item not null default 'bueno',
  fecha_adquisicion date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inventario_items_dep_idx on public.inventario_items (departamento_id);

-- =====================================================================
-- RESERVAS (RF06, RF17, RNF09)
-- =====================================================================
create sequence public.reserva_codigo_seq;

create table public.reservas (
  id bigint generated always as identity primary key,
  codigo text not null unique,
  cliente_id bigint not null references public.clientes (id),
  departamento_id bigint not null references public.departamentos (id),
  fecha_inicio date not null,
  fecha_fin date not null, -- día de check-out (exclusivo)
  noches int generated always as (fecha_fin - fecha_inicio) stored,
  num_huespedes int not null default 1 check (num_huespedes > 0),
  estado public.estado_reserva not null default 'pendiente_pago',
  origen public.origen_reserva not null default 'web',
  tarifa_noche_aplicada numeric(12, 0),
  monto_arriendo numeric(12, 0) not null default 0,
  monto_servicios numeric(12, 0) not null default 0,
  monto_cargos numeric(12, 0) not null default 0,
  monto_total numeric(12, 0) not null default 0,
  monto_anticipo numeric(12, 0) not null default 0,
  monto_pagado numeric(12, 0) not null default 0,
  saldo_pendiente numeric(12, 0) generated always as (monto_total - monto_pagado) stored,
  notas text,
  motivo_cancelacion text,
  cancelada_at timestamptz,
  creado_por uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_fin > fecha_inicio),
  -- Anti-overbooking: dos reservas activas no pueden solaparse en el mismo departamento
  constraint reservas_sin_solape exclude using gist (
    departamento_id with =,
    daterange(fecha_inicio, fecha_fin, '[)') with &&
  ) where (estado not in ('cancelada', 'no_show'))
);
create index reservas_cliente_idx on public.reservas (cliente_id);
create index reservas_departamento_fechas_idx on public.reservas (departamento_id, fecha_inicio);
create index reservas_estado_idx on public.reservas (estado);

create table public.acompanantes (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id) on delete cascade,
  nombre text not null,
  documento text not null,
  fecha_nacimiento date,
  telefono text,
  created_at timestamptz not null default now()
);
create index acompanantes_reserva_idx on public.acompanantes (reserva_id);

create table public.reserva_servicios (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id) on delete cascade,
  servicio_id bigint not null references public.servicios (id),
  cantidad int not null default 1 check (cantidad > 0),
  precio_unitario numeric(12, 0) not null,
  subtotal numeric(12, 0) generated always as (cantidad * precio_unitario) stored,
  fecha_programada timestamptz,
  estado public.estado_reserva_servicio not null default 'pendiente',
  notas text,
  created_at timestamptz not null default now()
);
create index reserva_servicios_reserva_idx on public.reserva_servicios (reserva_id);

-- =====================================================================
-- TRANSPORTE (RF09, RF10)
-- =====================================================================
create table public.transportes (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id) on delete cascade,
  reserva_servicio_id bigint references public.reserva_servicios (id) on delete set null,
  tipo public.tipo_transporte not null,
  vehiculo_id bigint references public.vehiculos (id),
  conductor_id bigint references public.conductores (id),
  fecha_hora timestamptz not null,
  origen text,
  destino text,
  pasajeros int not null default 1,
  estado public.estado_transporte not null default 'programado',
  notas text,
  correo_enviado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transportes_reserva_idx on public.transportes (reserva_id);
create index transportes_fecha_idx on public.transportes (fecha_hora);

-- =====================================================================
-- PAGOS (RF12) - Webpay Plus y medios presenciales
-- =====================================================================
create table public.pagos (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id),
  concepto public.concepto_pago not null,
  medio public.medio_pago not null,
  monto numeric(12, 0) not null check (monto > 0),
  estado public.estado_pago not null default 'pendiente',
  webpay_token text unique,
  webpay_buy_order text unique,
  webpay_authorization_code text,
  webpay_response jsonb,
  pagado_at timestamptz,
  registrado_por uuid references public.profiles (id),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pagos_reserva_idx on public.pagos (reserva_id);

-- =====================================================================
-- ACTAS CHECK-IN / CHECK-OUT (RF13-RF16) y CARGOS (RF15)
-- =====================================================================
create table public.actas (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id),
  tipo public.tipo_acta not null,
  funcionario_id uuid not null references public.profiles (id),
  fecha timestamptz not null default now(),
  checklist jsonb not null default '[]', -- [{item, estado, observacion}]
  observaciones text,
  firma_conformidad boolean not null default false,
  firma_path text,   -- Storage: firmas/
  pdf_path text,     -- Storage: actas/
  monto_cobrado numeric(12, 0) not null default 0,
  created_at timestamptz not null default now(),
  unique (reserva_id, tipo)
);

create table public.reserva_cargos (
  id bigint generated always as identity primary key,
  reserva_id bigint not null references public.reservas (id) on delete cascade,
  acta_id bigint references public.actas (id) on delete set null,
  inventario_item_id bigint references public.inventario_items (id),
  tipo public.tipo_cargo not null,
  descripcion text not null,
  monto numeric(12, 0) not null check (monto >= 0),
  registrado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index reserva_cargos_reserva_idx on public.reserva_cargos (reserva_id);

create table public.inventario_movimientos (
  id bigint generated always as identity primary key,
  item_id bigint not null references public.inventario_items (id) on delete cascade,
  tipo public.tipo_movimiento_inventario not null,
  cantidad int not null default 1,
  costo numeric(12, 0) not null default 0,
  descripcion text,
  reserva_id bigint references public.reservas (id) on delete set null,
  registrado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index inventario_movimientos_item_idx on public.inventario_movimientos (item_id);

-- =====================================================================
-- MANTENCIONES (RF18)
-- =====================================================================
create table public.mantenciones (
  id bigint generated always as identity primary key,
  departamento_id bigint not null references public.departamentos (id) on delete cascade,
  titulo text not null,
  descripcion text,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado public.estado_mantencion not null default 'programada',
  costo numeric(12, 0) not null default 0,
  responsable text,
  creado_por uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);
create index mantenciones_dep_rango_idx on public.mantenciones using gist (departamento_id, daterange(fecha_inicio, fecha_fin, '[]'));

-- =====================================================================
-- FINANZAS (RF19-RF21)
-- =====================================================================
create table public.movimientos_financieros (
  id bigint generated always as identity primary key,
  tipo public.tipo_movimiento not null,
  categoria public.categoria_movimiento not null,
  monto numeric(12, 0) not null check (monto > 0),
  fecha date not null default (now() at time zone 'America/Santiago')::date,
  descripcion text,
  departamento_id bigint references public.departamentos (id) on delete set null,
  reserva_id bigint references public.reservas (id) on delete set null,
  pago_id bigint unique references public.pagos (id) on delete set null,
  mantencion_id bigint references public.mantenciones (id) on delete set null,
  comprobante_path text,
  registrado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index movimientos_fecha_idx on public.movimientos_financieros (fecha);
create index movimientos_departamento_idx on public.movimientos_financieros (departamento_id);

-- =====================================================================
-- NOTIFICACIONES (RF10, RF23)
-- =====================================================================
create table public.notificaciones (
  id bigint generated always as identity primary key,
  tipo public.tipo_notificacion not null,
  destinatario text not null,
  asunto text not null,
  reserva_id bigint references public.reservas (id) on delete cascade,
  payload jsonb not null default '{}',
  estado public.estado_notificacion not null default 'pendiente',
  programada_para timestamptz not null default now(),
  enviada_at timestamptz,
  error text,
  proveedor_id text,
  created_at timestamptz not null default now()
);
create index notificaciones_pendientes_idx on public.notificaciones (programada_para) where estado = 'pendiente';

-- =====================================================================
-- AUDITORÍA INMUTABLE (RNF15)
-- =====================================================================
create table public.auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  registro_id text not null,
  accion text not null,
  usuario_id uuid,
  datos_antes jsonb,
  datos_despues jsonb,
  created_at timestamptz not null default now()
);
create index auditoria_tabla_registro_idx on public.auditoria (tabla, registro_id);

create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.auditoria (tabla, registro_id, accion, usuario_id, datos_antes, datos_despues)
  values (
    tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'),
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- =====================================================================
-- LÓGICA DE NEGOCIO
-- =====================================================================

-- Valor numérico de configuración
create or replace function public.config_num(p_clave text, p_default numeric default 0) returns numeric
language sql stable set search_path = public as $$
  select coalesce((select (valor #>> '{}')::numeric from public.configuracion where clave = p_clave), p_default);
$$;

-- Tarifa por noche de un departamento en una fecha (temporada específica > temporada global > base)
create or replace function public.tarifa_noche(p_departamento bigint, p_fecha date) returns numeric
language sql stable set search_path = public as $$
  select coalesce(
    (select tarifa_noche from public.tarifas_temporada
      where p_fecha between fecha_inicio and fecha_fin
        and (departamento_id = p_departamento or departamento_id is null)
      order by departamento_id nulls last limit 1),
    (select tarifa_base from public.departamentos where id = p_departamento)
  );
$$;

-- Monto de arriendo sumando la tarifa de cada noche
create or replace function public.calcular_arriendo(p_departamento bigint, p_inicio date, p_fin date) returns numeric
language sql stable set search_path = public as $$
  select coalesce(sum(public.tarifa_noche(p_departamento, d::date)), 0)
  from generate_series(p_inicio, p_fin - 1, interval '1 day') d;
$$;

-- ¿Hay mantención activa que se cruce con el rango?
create or replace function public.mantencion_solapa(p_departamento bigint, p_inicio date, p_fin date) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from public.mantenciones
    where departamento_id = p_departamento and estado in ('programada', 'en_curso')
      and daterange(fecha_inicio, fecha_fin, '[]') && daterange(p_inicio, p_fin, '[)')
  );
$$;

-- Estado en tiempo real del departamento (RF05)
create or replace function public.estado_departamento_actual(p_departamento bigint, p_fecha date default (now() at time zone 'America/Santiago')::date)
returns public.estado_departamento language sql stable set search_path = public as $$
  select case
    when not (select activo from public.departamentos where id = p_departamento) then 'inactivo'
    when exists (select 1 from public.mantenciones where departamento_id = p_departamento and estado in ('programada', 'en_curso') and p_fecha between fecha_inicio and fecha_fin) then 'en_mantencion'
    when exists (select 1 from public.reservas where departamento_id = p_departamento and estado = 'en_curso' and p_fecha >= fecha_inicio and p_fecha < fecha_fin) then 'ocupado'
    when exists (select 1 from public.reservas where departamento_id = p_departamento and estado in ('pendiente_pago', 'confirmada') and p_fecha >= fecha_inicio and p_fecha < fecha_fin) then 'reservado'
    else 'disponible'
  end::public.estado_departamento;
$$;

-- Departamentos disponibles para un rango (motor de búsqueda del portal, RF06)
create or replace function public.departamentos_disponibles(p_inicio date, p_fin date, p_zona bigint default null, p_huespedes int default 1)
returns setof public.departamentos language sql stable set search_path = public as $$
  select d.* from public.departamentos d
  where d.activo
    and (p_zona is null or d.zona_id = p_zona)
    and d.capacidad_max >= p_huespedes
    and not exists (
      select 1 from public.reservas r
      where r.departamento_id = d.id and r.estado not in ('cancelada', 'no_show')
        and daterange(r.fecha_inicio, r.fecha_fin, '[)') && daterange(p_inicio, p_fin, '[)'))
    and not public.mantencion_solapa(d.id, p_inicio, p_fin)
  order by d.zona_id, d.nombre;
$$;

-- Antes de insertar/actualizar una reserva: código, tarifas, anticipo, bloqueo por mantención
create or replace function public.reservas_before_write()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.codigo := 'DT-' || to_char(now() at time zone 'America/Santiago', 'YYYY') || '-' || lpad(nextval('public.reserva_codigo_seq')::text, 5, '0');
    if new.creado_por is null then new.creado_por := auth.uid(); end if;
  end if;
  if tg_op = 'INSERT' or new.fecha_inicio <> old.fecha_inicio or new.fecha_fin <> old.fecha_fin or new.departamento_id <> old.departamento_id then
    new.monto_arriendo := public.calcular_arriendo(new.departamento_id, new.fecha_inicio, new.fecha_fin);
    new.tarifa_noche_aplicada := round(new.monto_arriendo / greatest(new.fecha_fin - new.fecha_inicio, 1));
    if tg_op = 'INSERT' then
      new.monto_anticipo := round(new.monto_arriendo * public.config_num('porcentaje_anticipo', 30) / 100);
    end if;
  end if;
  if new.estado not in ('cancelada', 'no_show') and public.mantencion_solapa(new.departamento_id, new.fecha_inicio, new.fecha_fin) then
    raise exception 'El departamento tiene una mantención programada en esas fechas' using errcode = 'P0001';
  end if;
  if new.estado = 'cancelada' and new.cancelada_at is null then new.cancelada_at := now(); end if;
  new.monto_total := new.monto_arriendo + new.monto_servicios + new.monto_cargos;
  return new;
end;
$$;
create trigger reservas_before_write before insert or update on public.reservas
  for each row execute function public.reservas_before_write();

-- Recalcular montos de una reserva a partir de servicios, cargos y pagos
create or replace function public.recalcular_reserva(p_reserva bigint) returns void
language plpgsql security definer set search_path = public as $$
declare v_servicios numeric; v_cargos numeric; v_pagado numeric; r public.reservas;
begin
  select coalesce(sum(subtotal), 0) into v_servicios from public.reserva_servicios where reserva_id = p_reserva and estado <> 'cancelado';
  select coalesce(sum(monto), 0) into v_cargos from public.reserva_cargos where reserva_id = p_reserva;
  select coalesce(sum(case when concepto = 'reembolso' then -monto else monto end), 0) into v_pagado
    from public.pagos where reserva_id = p_reserva and estado = 'aprobado';
  update public.reservas set monto_servicios = v_servicios, monto_cargos = v_cargos, monto_pagado = v_pagado
    where id = p_reserva returning * into r;
  if r.estado = 'pendiente_pago' and r.monto_pagado >= r.monto_anticipo and r.monto_anticipo > 0 then
    update public.reservas set estado = 'confirmada' where id = p_reserva;
  end if;
end;
$$;

create or replace function public.trg_recalcular_reserva() returns trigger
language plpgsql set search_path = public as $$
begin
  perform public.recalcular_reserva(coalesce(new.reserva_id, old.reserva_id));
  return coalesce(new, old);
end;
$$;
create trigger reserva_servicios_recalc after insert or update or delete on public.reserva_servicios for each row execute function public.trg_recalcular_reserva();
create trigger reserva_cargos_recalc after insert or update or delete on public.reserva_cargos for each row execute function public.trg_recalcular_reserva();
create trigger pagos_recalc after insert or update or delete on public.pagos for each row execute function public.trg_recalcular_reserva();

-- Pago aprobado => ingreso financiero automático (RF19)
create or replace function public.pagos_after_aprobado() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_dep bigint;
begin
  if new.estado = 'aprobado' and (tg_op = 'INSERT' or old.estado is distinct from 'aprobado') then
    if new.pagado_at is null then update public.pagos set pagado_at = now() where id = new.id; end if;
    select departamento_id into v_dep from public.reservas where id = new.reserva_id;
    insert into public.movimientos_financieros (tipo, categoria, monto, descripcion, departamento_id, reserva_id, pago_id, registrado_por)
    values (
      (case when new.concepto = 'reembolso' then 'egreso' else 'ingreso' end)::public.tipo_movimiento,
      (case new.concepto::text when 'servicio_extra' then 'servicio_extra' when 'cargo' then 'cargo' when 'reembolso' then 'reembolso' else 'arriendo' end)::public.categoria_movimiento,
      new.monto, 'Pago ' || new.concepto || ' reserva ' || (select codigo from public.reservas where id = new.reserva_id),
      v_dep, new.reserva_id, new.id, coalesce(new.registrado_por, auth.uid())
    ) on conflict (pago_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger pagos_after_aprobado after insert or update on public.pagos for each row execute function public.pagos_after_aprobado();

-- Acta de check-in => reserva en curso; acta de check-out => finalizada (RF13, RF15)
create or replace function public.actas_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.reservas set estado = case when new.tipo = 'check_in' then 'en_curso' else 'finalizada' end::public.estado_reserva
    where id = new.reserva_id;
  return new;
end;
$$;
create trigger actas_after_insert after insert on public.actas for each row execute function public.actas_after_insert();

-- Mantención no puede cruzarse con reservas activas (RF18)
create or replace function public.mantenciones_before_write() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.estado in ('programada', 'en_curso') and exists (
    select 1 from public.reservas r
    where r.departamento_id = new.departamento_id and r.estado not in ('cancelada', 'no_show', 'finalizada')
      and daterange(r.fecha_inicio, r.fecha_fin, '[)') && daterange(new.fecha_inicio, new.fecha_fin, '[]')
  ) then
    raise exception 'Existen reservas activas en el rango de la mantención' using errcode = 'P0001';
  end if;
  if new.creado_por is null then new.creado_por := auth.uid(); end if;
  return new;
end;
$$;
create trigger mantenciones_before_write before insert or update on public.mantenciones for each row execute function public.mantenciones_before_write();

-- Mantención completada con costo => egreso financiero
create or replace function public.mantenciones_after_completada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'completada' and old.estado is distinct from 'completada' and new.costo > 0 then
    insert into public.movimientos_financieros (tipo, categoria, monto, descripcion, departamento_id, mantencion_id, registrado_por)
    values ('egreso', 'mantencion', new.costo, new.titulo, new.departamento_id, new.id, auth.uid());
  end if;
  return new;
end;
$$;
create trigger mantenciones_after_completada after update on public.mantenciones for each row execute function public.mantenciones_after_completada();

-- updated_at
create trigger configuracion_updated_at before update on public.configuracion for each row execute function public.set_updated_at();
create trigger departamentos_updated_at before update on public.departamentos for each row execute function public.set_updated_at();
create trigger servicios_updated_at before update on public.servicios for each row execute function public.set_updated_at();
create trigger clientes_updated_at before update on public.clientes for each row execute function public.set_updated_at();
create trigger inventario_items_updated_at before update on public.inventario_items for each row execute function public.set_updated_at();
create trigger reservas_updated_at before update on public.reservas for each row execute function public.set_updated_at();
create trigger transportes_updated_at before update on public.transportes for each row execute function public.set_updated_at();
create trigger pagos_updated_at before update on public.pagos for each row execute function public.set_updated_at();
create trigger mantenciones_updated_at before update on public.mantenciones for each row execute function public.set_updated_at();

-- Auditoría de operaciones críticas
create trigger reservas_auditoria after insert or update or delete on public.reservas for each row execute function public.registrar_auditoria();
create trigger pagos_auditoria after insert or update or delete on public.pagos for each row execute function public.registrar_auditoria();
create trigger actas_auditoria after insert or update or delete on public.actas for each row execute function public.registrar_auditoria();
create trigger reserva_cargos_auditoria after insert or update or delete on public.reserva_cargos for each row execute function public.registrar_auditoria();
create trigger mantenciones_auditoria after insert or update or delete on public.mantenciones for each row execute function public.registrar_auditoria();

-- =====================================================================
-- VISTAS
-- =====================================================================
create or replace view public.vw_departamentos with (security_invoker = true) as
select d.*, z.nombre as zona_nombre, public.estado_departamento_actual(d.id) as estado_actual,
  (select storage_path from public.departamento_fotos f where f.departamento_id = d.id order by es_portada desc, orden limit 1) as foto_portada
from public.departamentos d join public.zonas z on z.id = d.zona_id;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.configuracion enable row level security;
alter table public.zonas enable row level security;
alter table public.departamentos enable row level security;
alter table public.departamento_fotos enable row level security;
alter table public.tarifas_temporada enable row level security;
alter table public.servicios enable row level security;
alter table public.vehiculos enable row level security;
alter table public.conductores enable row level security;
alter table public.clientes enable row level security;
alter table public.inventario_items enable row level security;
alter table public.inventario_movimientos enable row level security;
alter table public.reservas enable row level security;
alter table public.acompanantes enable row level security;
alter table public.reserva_servicios enable row level security;
alter table public.transportes enable row level security;
alter table public.pagos enable row level security;
alter table public.actas enable row level security;
alter table public.reserva_cargos enable row level security;
alter table public.mantenciones enable row level security;
alter table public.movimientos_financieros enable row level security;
alter table public.notificaciones enable row level security;
alter table public.auditoria enable row level security;

-- Catálogos públicos (lectura anónima) y escritura de admin
create policy "publico lee zonas" on public.zonas for select using (true);
create policy "admin gestiona zonas" on public.zonas for all using ((select public.es_admin()));
create policy "publico lee departamentos activos" on public.departamentos for select using (activo or (select public.es_staff()));
create policy "admin gestiona departamentos" on public.departamentos for all using ((select public.es_admin()));
create policy "publico lee fotos" on public.departamento_fotos for select using (true);
create policy "admin gestiona fotos" on public.departamento_fotos for all using ((select public.es_admin()));
create policy "publico lee tarifas" on public.tarifas_temporada for select using (true);
create policy "admin gestiona tarifas" on public.tarifas_temporada for all using ((select public.es_admin()));
create policy "publico lee servicios activos" on public.servicios for select using (activo or (select public.es_staff()));
create policy "admin gestiona servicios" on public.servicios for all using ((select public.es_admin()));
create policy "publico lee configuracion" on public.configuracion for select using (true);
create policy "admin gestiona configuracion" on public.configuracion for all using ((select public.es_admin()));
create policy "staff lee vehiculos" on public.vehiculos for select using ((select public.es_staff()));
create policy "admin gestiona vehiculos" on public.vehiculos for all using ((select public.es_admin()));
create policy "staff lee conductores" on public.conductores for select using ((select public.es_staff()));
create policy "admin gestiona conductores" on public.conductores for all using ((select public.es_admin()));

-- Clientes
create policy "cliente ve su ficha" on public.clientes for select using (profile_id = (select auth.uid()));
create policy "cliente edita su ficha" on public.clientes for update using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "staff gestiona clientes" on public.clientes for all using ((select public.es_staff()));

-- Reservas y tablas hijas
create policy "cliente ve sus reservas" on public.reservas for select using (cliente_id = (select public.cliente_actual_id()));
create policy "cliente crea reserva propia" on public.reservas for insert
  with check (cliente_id = (select public.cliente_actual_id()) and estado = 'pendiente_pago' and origen = 'web');
create policy "staff gestiona reservas" on public.reservas for all using ((select public.es_staff()));

create policy "cliente ve acompanantes" on public.acompanantes for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "cliente registra acompanantes" on public.acompanantes for insert
  with check (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id()) and r.estado in ('pendiente_pago', 'confirmada')));
create policy "cliente elimina acompanantes" on public.acompanantes for delete
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id()) and r.estado in ('pendiente_pago', 'confirmada')));
create policy "staff gestiona acompanantes" on public.acompanantes for all using ((select public.es_staff()));

create policy "cliente ve sus servicios" on public.reserva_servicios for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "cliente contrata servicios" on public.reserva_servicios for insert
  with check (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id()) and r.estado in ('pendiente_pago', 'confirmada')));
create policy "staff gestiona reserva_servicios" on public.reserva_servicios for all using ((select public.es_staff()));

create policy "cliente ve sus transportes" on public.transportes for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "staff gestiona transportes" on public.transportes for all using ((select public.es_staff()));

create policy "cliente ve sus pagos" on public.pagos for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "staff gestiona pagos" on public.pagos for all using ((select public.es_staff()));

create policy "cliente ve sus actas" on public.actas for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "staff gestiona actas" on public.actas for all using ((select public.es_staff()));

create policy "cliente ve sus cargos" on public.reserva_cargos for select
  using (exists (select 1 from public.reservas r where r.id = reserva_id and r.cliente_id = (select public.cliente_actual_id())));
create policy "staff gestiona cargos" on public.reserva_cargos for all using ((select public.es_staff()));

-- Operación interna
create policy "staff gestiona inventario" on public.inventario_items for all using ((select public.es_staff()));
create policy "staff gestiona movimientos inventario" on public.inventario_movimientos for all using ((select public.es_staff()));
create policy "staff lee mantenciones" on public.mantenciones for select using ((select public.es_staff()));
create policy "admin gestiona mantenciones" on public.mantenciones for all using ((select public.es_admin()));
create policy "admin gestiona finanzas" on public.movimientos_financieros for all using ((select public.es_admin()));
create policy "admin lee notificaciones" on public.notificaciones for select using ((select public.es_admin()));
create policy "admin lee auditoria" on public.auditoria for select using ((select public.es_admin()));
-- auditoria: sin políticas de escritura => inmutable desde la API (solo los triggers escriben)

-- =====================================================================
-- STORAGE
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('departamentos', 'departamentos', true),
  ('actas', 'actas', false),
  ('firmas', 'firmas', false),
  ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "publico lee fotos departamentos" on storage.objects for select using (bucket_id = 'departamentos');
create policy "admin gestiona fotos departamentos" on storage.objects for all using (bucket_id = 'departamentos' and (select public.es_admin()));
create policy "staff gestiona actas y firmas" on storage.objects for all
  using (bucket_id in ('actas', 'firmas', 'comprobantes') and (select public.es_staff()));

-- Zona horaria por defecto para sesiones (RNF16)
do $$ begin
  execute 'alter database ' || current_database() || ' set timezone to ''America/Santiago''';
exception when others then null; end $$;
