-- Fase 0/1: perfiles y roles (RF01, RNF04)
create type public.rol_usuario as enum ('admin', 'funcionario', 'cliente');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol public.rol_usuario not null default 'cliente',
  telefono text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Rol del usuario autenticado (usado por las políticas RLS)
create or replace function public.rol_actual()
returns public.rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid();
$$;

create policy "perfil: ver el propio" on public.profiles
  for select using (id = auth.uid());
create policy "perfil: admin ve todos" on public.profiles
  for select using (public.rol_actual() = 'admin');
create policy "perfil: editar el propio sin cambiar rol" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and rol = public.rol_actual());
create policy "perfil: admin edita todos" on public.profiles
  for update using (public.rol_actual() = 'admin');

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
