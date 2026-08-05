-- BRILLARA advisor management
-- Run this AFTER 20260804_secure_brillara.sql in Supabase SQL Editor.
-- It preserves existing advisors, hashes legacy passwords, and exposes only
-- server-side RPCs for creation, password changes, code changes, and deletion.

begin;

create extension if not exists pgcrypto with schema extensions;

alter table public.advisors add column if not exists password_hash text;
alter table public.advisors add column if not exists session_version integer not null default 1;
alter table public.advisors add column if not exists created_at timestamptz not null default now();
alter table public.advisors add column if not exists updated_at timestamptz not null default now();

-- The old application stored advisor passwords in clear text. Convert any
-- remaining legacy value once, then remove it from the row.
alter table public.advisors alter column password drop not null;
update public.advisors
set password_hash = extensions.crypt(password, extensions.gen_salt('bf', 12))
where password_hash is null
  and nullif(password, '') is not null;

update public.advisors
set password = null
where password_hash is not null
  and password is not null;

create unique index if not exists advisors_code_unique_idx on public.advisors (code);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_advisors_updated_at on public.advisors;
create trigger set_advisors_updated_at
before update on public.advisors
for each row execute function public.set_updated_at();

-- Recreate the verifier so legacy records migrated above and new records use
-- exactly the same password verification path.
create or replace function public.verify_advisor_credentials(p_code text, p_password text)
returns table (id text, code text, name text)
language sql
security definer
set search_path = public, extensions
as $$
  select a.id::text, a.code, a.name
  from public.advisors a
  where a.code = btrim(p_code)
    and a.password_hash is not null
    and a.password_hash = extensions.crypt(p_password, a.password_hash)
  limit 1;
$$;

create or replace function public.admin_create_advisor(
  p_name text,
  p_code text,
  p_password text
)
returns table (id text, code text, name text, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := btrim(p_name);
  v_code text := btrim(p_code);
  v_password text := p_password;
begin
  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'El nombre del asesor debe tener entre 2 y 80 caracteres.';
  end if;

  if v_code is null or v_code !~ '^[A-Za-z0-9_-]{3,32}$' then
    raise exception using errcode = '22023', message = 'El código debe tener entre 3 y 32 caracteres alfanuméricos.';
  end if;

  if v_password is null or char_length(v_password) not between 8 and 256 then
    raise exception using errcode = '22023', message = 'La contraseña debe tener entre 8 y 256 caracteres.';
  end if;

  return query
  with created as (
    insert into public.advisors (name, code, password, password_hash)
    values (v_name, v_code, null, extensions.crypt(v_password, extensions.gen_salt('bf', 12)))
    returning advisors.id, advisors.code, advisors.name, advisors.created_at, advisors.updated_at
  )
  select created.id::text, created.code, created.name, created.created_at, created.updated_at
  from created;
end;
$$;

create or replace function public.admin_update_advisor(
  p_id text,
  p_name text,
  p_code text,
  p_password text default null
)
returns table (id text, code text, name text, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := btrim(p_name);
  v_code text := btrim(p_code);
  v_password text := nullif(p_password, '');
begin
  if p_id is null or btrim(p_id) = '' then
    raise exception using errcode = '22023', message = 'El asesor no es válido.';
  end if;

  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'El nombre del asesor debe tener entre 2 y 80 caracteres.';
  end if;

  if v_code is null or v_code !~ '^[A-Za-z0-9_-]{3,32}$' then
    raise exception using errcode = '22023', message = 'El código debe tener entre 3 y 32 caracteres alfanuméricos.';
  end if;

  if v_password is not null and char_length(v_password) not between 8 and 256 then
    raise exception using errcode = '22023', message = 'La contraseña debe tener entre 8 y 256 caracteres.';
  end if;

  return query
  with changed as (
    update public.advisors a
    set
      name = v_name,
      code = v_code,
      password = null,
      password_hash = case
        when v_password is null then a.password_hash
        else extensions.crypt(v_password, extensions.gen_salt('bf', 12))
      end,
      -- Resetting a password invalidates any existing signed advisor cookie.
      session_version = case when v_password is null then a.session_version else a.session_version + 1 end
    where a.id::text = btrim(p_id)
    returning a.id, a.code, a.name, a.created_at, a.updated_at
  )
  select changed.id::text, changed.code, changed.name, changed.created_at, changed.updated_at
  from changed;

  if not found then
    raise exception using errcode = 'P0002', message = 'El asesor no existe.';
  end if;
end;
$$;

create or replace function public.admin_delete_advisor(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_id is null or btrim(p_id) = '' then
    raise exception using errcode = '22023', message = 'El asesor no es válido.';
  end if;

  -- A deleted advisor must not retain tickets or continue to work from an old
  -- session. Ticket access is revalidated by the application on every request.
  update public.tickets
  set advisor_id = null, updated_at = now()
  where advisor_id::text = btrim(p_id);

  delete from public.advisors a where a.id::text = btrim(p_id);
  if not found then
    raise exception using errcode = 'P0002', message = 'El asesor no existe.';
  end if;
end;
$$;

revoke all on function public.verify_advisor_credentials(text, text) from public, anon, authenticated;
revoke all on function public.admin_create_advisor(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_advisor(text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_advisor(text) from public, anon, authenticated;

grant execute on function public.verify_advisor_credentials(text, text) to service_role;
grant execute on function public.admin_create_advisor(text, text, text) to service_role;
grant execute on function public.admin_update_advisor(text, text, text, text) to service_role;
grant execute on function public.admin_delete_advisor(text) to service_role;

commit;
