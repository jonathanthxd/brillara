-- BRILLARA referral tracking
-- Run this AFTER 20260804_secure_brillara.sql and 20260805_advisor_management.sql.
-- It keeps referral attribution separate from the advisor who operationally
-- attends a ticket, so the origin of a lead remains auditable.

begin;

create extension if not exists pgcrypto with schema extensions;

-- A public referral code is stable even if an administrator later changes an
-- advisor's login code. Existing advisors start with their current code.
alter table public.advisors add column if not exists referral_code text;
update public.advisors
set referral_code = code
where referral_code is null or btrim(referral_code) = '';
alter table public.advisors alter column referral_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'advisors_referral_code_format_check'
      and conrelid = 'public.advisors'::regclass
  ) then
    alter table public.advisors
      add constraint advisors_referral_code_format_check
      check (referral_code ~ '^[A-Za-z0-9_-]{3,32}$');
  end if;
end;
$$;

create unique index if not exists advisors_referral_code_unique_idx
  on public.advisors (referral_code);

create table if not exists public.referral_attributions (
  id uuid primary key default extensions.gen_random_uuid(),
  -- Text deliberately preserves historical attribution if an advisor is later
  -- deleted or their database key uses a different native type.
  advisor_id text not null,
  advisor_code text not null,
  advisor_name text not null,
  landing_path text not null default '/',
  source text not null check (source in ('path', 'query', 'hash')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  registered_at timestamptz,
  registered_name text,
  created_at timestamptz not null default now()
);

create index if not exists referral_attributions_advisor_first_seen_idx
  on public.referral_attributions (advisor_id, first_seen_at desc);
create index if not exists referral_attributions_registered_idx
  on public.referral_attributions (advisor_id, registered_at desc)
  where registered_at is not null;

alter table public.tickets add column if not exists referral_attribution_id uuid;
alter table public.tickets add column if not exists referrer_advisor_id text;
alter table public.tickets add column if not exists referrer_code text;
alter table public.tickets add column if not exists referrer_name text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tickets_referral_attribution_id_fkey'
      and conrelid = 'public.tickets'::regclass
  ) then
    alter table public.tickets
      add constraint tickets_referral_attribution_id_fkey
      foreign key (referral_attribution_id)
      references public.referral_attributions (id)
      on delete set null;
  end if;
end;
$$;

create index if not exists tickets_referrer_advisor_status_created_idx
  on public.tickets (referrer_advisor_id, status, created_at desc)
  where referrer_advisor_id is not null;
create index if not exists tickets_referral_attribution_idx
  on public.tickets (referral_attribution_id)
  where referral_attribution_id is not null;

-- The server reads this aggregate with its service role. It avoids loading all
-- raw leads just to draw the management metrics for every advisor.
create or replace function public.admin_referral_report()
returns table (
  advisor_id text,
  advisor_code text,
  advisor_name text,
  referral_code text,
  unique_visitors bigint,
  registered_leads bigint,
  tickets_created bigint,
  purchases_completed bigint
)
language sql
security definer
set search_path = public
as $$
  select
    a.id::text as advisor_id,
    a.code as advisor_code,
    a.name as advisor_name,
    a.referral_code,
    coalesce(attribution_stats.unique_visitors, 0::bigint) as unique_visitors,
    coalesce(attribution_stats.registered_leads, 0::bigint) as registered_leads,
    coalesce(ticket_stats.tickets_created, 0::bigint) as tickets_created,
    coalesce(ticket_stats.purchases_completed, 0::bigint) as purchases_completed
  from public.advisors a
  left join (
    select
      ra.advisor_id,
      count(*)::bigint as unique_visitors,
      (count(*) filter (where ra.registered_at is not null))::bigint as registered_leads
    from public.referral_attributions ra
    group by ra.advisor_id
  ) attribution_stats on attribution_stats.advisor_id = a.id::text
  left join (
    select
      t.referrer_advisor_id,
      count(*)::bigint as tickets_created,
      (count(*) filter (where t.status = 'compra-realizada'))::bigint as purchases_completed
    from public.tickets t
    where t.referrer_advisor_id is not null
    group by t.referrer_advisor_id
  ) ticket_stats on ticket_stats.referrer_advisor_id = a.id::text
  order by a.name asc;
$$;

-- New advisors receive a referral code at creation. Updating their login code
-- intentionally does not alter their public link or historical campaign data.
-- The return shape gains referral_code, therefore these existing RPCs need to
-- be recreated rather than merely replaced.
drop function if exists public.admin_create_advisor(text, text, text);
drop function if exists public.admin_update_advisor(text, text, text, text);

create or replace function public.admin_create_advisor(
  p_name text,
  p_code text,
  p_password text
)
returns table (id text, code text, name text, referral_code text, created_at timestamptz, updated_at timestamptz)
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
    insert into public.advisors (name, code, referral_code, password, password_hash)
    values (v_name, v_code, v_code, null, extensions.crypt(v_password, extensions.gen_salt('bf', 12)))
    returning advisors.id, advisors.code, advisors.name, advisors.referral_code, advisors.created_at, advisors.updated_at
  )
  select created.id::text, created.code, created.name, created.referral_code, created.created_at, created.updated_at
  from created;
end;
$$;

create or replace function public.admin_update_advisor(
  p_id text,
  p_name text,
  p_code text,
  p_password text default null
)
returns table (id text, code text, name text, referral_code text, created_at timestamptz, updated_at timestamptz)
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
      session_version = case when v_password is null then a.session_version else a.session_version + 1 end
    where a.id::text = btrim(p_id)
    returning a.id, a.code, a.name, a.referral_code, a.created_at, a.updated_at
  )
  select changed.id::text, changed.code, changed.name, changed.referral_code, changed.created_at, changed.updated_at
  from changed;

  if not found then
    raise exception using errcode = 'P0002', message = 'El asesor no existe.';
  end if;
end;
$$;

alter table public.referral_attributions enable row level security;
revoke all on table public.referral_attributions from anon, authenticated;
revoke all on function public.admin_referral_report() from public, anon, authenticated;
revoke all on function public.admin_create_advisor(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_advisor(text, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_referral_report() to service_role;
grant execute on function public.admin_create_advisor(text, text, text) to service_role;
grant execute on function public.admin_update_advisor(text, text, text, text) to service_role;

commit;
