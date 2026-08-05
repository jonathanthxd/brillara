-- BRILLARA partner operations
-- Run this AFTER the three existing migrations. It adds the in-person
-- verification flow without changing prior referral attribution records.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.partners (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  type text not null check (char_length(btrim(type)) between 2 and 60),
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_locations (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  address text,
  city text,
  timezone text not null default 'America/Los_Angeles',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, partner_id)
);

create table if not exists public.partner_users (
  id uuid primary key default extensions.gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  location_id uuid,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  code text not null check (code ~ '^[A-Za-z0-9_-]{3,64}$'),
  password_hash text not null,
  role text not null check (role in ('owner', 'manager', 'buyer')),
  active boolean not null default true,
  session_version integer not null default 1 check (session_version > 0),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code),
  foreign key (location_id, partner_id)
    references public.partner_locations(id, partner_id)
    on delete restrict
);

-- Tickets were created before this project had migrations, so their native id
-- can differ between deployments. The following tables obtain that exact type
-- dynamically and still enforce real foreign keys to public.tickets(id).
do $$
declare
  v_ticket_id_type text;
begin
  select pg_catalog.format_type(attribute.atttypid, attribute.atttypmod)
  into v_ticket_id_type
  from pg_catalog.pg_attribute attribute
  where attribute.attrelid = 'public.tickets'::regclass
    and attribute.attname = 'id'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  if v_ticket_id_type is null then
    raise exception 'No se pudo detectar el tipo de public.tickets.id.';
  end if;

  execute format($sql$
    create table if not exists public.partner_appointments (
      id uuid primary key default extensions.gen_random_uuid(),
      ticket_id %s not null references public.tickets(id) on delete restrict,
      partner_id uuid not null references public.partners(id) on delete restrict,
      location_id uuid not null,
      scheduled_at timestamptz not null,
      status text not null default 'programada'
        check (status in ('programada', 'pendiente-confirmacion', 'completada', 'no-asistio', 'no-concretada', 'reprogramada', 'en-revision', 'cancelada')),
      created_by_advisor_id text,
      notes text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      foreign key (location_id, partner_id)
        references public.partner_locations(id, partner_id)
        on delete restrict
    )
  $sql$, v_ticket_id_type);

  execute format($sql$
    create table if not exists public.purchases (
      id uuid primary key default extensions.gen_random_uuid(),
      ticket_id %s not null unique references public.tickets(id) on delete restrict,
      appointment_id uuid not null references public.partner_appointments(id) on delete restrict,
      partner_id uuid not null references public.partners(id) on delete restrict,
      location_id uuid not null,
      confirmed_by_partner_user_id uuid not null references public.partner_users(id) on delete restrict,
      metal text not null check (char_length(btrim(metal)) between 2 and 80),
      purity text not null check (char_length(btrim(purity)) between 1 and 60),
      gross_weight_grams numeric(14, 4) not null check (gross_weight_grams > 0),
      net_weight_grams numeric(14, 4) not null check (net_weight_grams > 0 and net_weight_grams <= gross_weight_grams),
      price_per_gram numeric(14, 4) not null check (price_per_gram >= 0),
      calculated_total numeric(14, 2) not null check (calculated_total >= 0),
      total_paid numeric(14, 2) not null check (total_paid >= 0),
      total_explanation text,
      payment_method text not null check (payment_method in ('cash', 'check', 'zelle', 'venmo', 'bank_transfer', 'other')),
      payment_reference text,
      employee_name text,
      notes text,
      receipt_url text,
      confirmed_at timestamptz not null default now(),
      voided_at timestamptz,
      void_reason text,
      voided_by_actor_id text,
      voided_by_actor_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      foreign key (location_id, partner_id)
        references public.partner_locations(id, partner_id)
        on delete restrict
    )
  $sql$, v_ticket_id_type);

  execute format($sql$
    create table if not exists public.partner_ticket_events (
      id uuid primary key default extensions.gen_random_uuid(),
      ticket_id %s not null references public.tickets(id) on delete restrict,
      event_type text not null check (char_length(btrim(event_type)) between 2 and 100),
      actor_type text not null check (actor_type in ('advisor', 'partner_user', 'admin', 'system')),
      actor_id text,
      actor_name text,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  $sql$, v_ticket_id_type);
end;
$$;

create table if not exists public.purchase_items (
  id uuid primary key default extensions.gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  metal text not null check (char_length(btrim(metal)) between 2 and 80),
  purity text not null check (char_length(btrim(purity)) between 1 and 60),
  gross_weight_grams numeric(14, 4) not null check (gross_weight_grams > 0),
  net_weight_grams numeric(14, 4) not null check (net_weight_grams > 0 and net_weight_grams <= gross_weight_grams),
  price_per_gram numeric(14, 4) not null check (price_per_gram >= 0),
  calculated_total numeric(14, 2) not null check (calculated_total >= 0),
  total_paid numeric(14, 2) not null check (total_paid >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_corrections (
  id uuid primary key default extensions.gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) between 5 and 1_000),
  previous_values jsonb not null,
  changed_values jsonb not null,
  corrected_by_actor_id text not null,
  corrected_by_actor_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_auth_events (
  id bigint generated by default as identity primary key,
  partner_user_id uuid references public.partner_users(id) on delete set null,
  identifier text not null,
  successful boolean not null,
  remote_address text,
  created_at timestamptz not null default now()
);

alter table public.tickets add column if not exists partner_id uuid references public.partners(id) on delete set null;
alter table public.tickets add column if not exists partner_location_id uuid;
alter table public.tickets add column if not exists closed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tickets_partner_location_partner_fkey'
      and conrelid = 'public.tickets'::regclass
  ) then
    alter table public.tickets
      add constraint tickets_partner_location_partner_fkey
      foreign key (partner_location_id, partner_id)
      references public.partner_locations(id, partner_id)
      on delete set null;
  end if;
end;
$$;

create index if not exists partner_locations_partner_active_idx on public.partner_locations(partner_id, active, name);
create index if not exists partner_users_partner_active_idx on public.partner_users(partner_id, active, name);
create index if not exists partner_users_location_active_idx on public.partner_users(location_id, active) where location_id is not null;
create index if not exists partner_appointments_partner_schedule_idx on public.partner_appointments(partner_id, location_id, scheduled_at desc);
create index if not exists partner_appointments_ticket_idx on public.partner_appointments(ticket_id, created_at desc);
create index if not exists purchases_partner_confirmed_idx on public.purchases(partner_id, location_id, confirmed_at desc) where voided_at is null;
create index if not exists purchases_ticket_active_idx on public.purchases(ticket_id) where voided_at is null;
create index if not exists partner_ticket_events_ticket_created_idx on public.partner_ticket_events(ticket_id, created_at desc);
create index if not exists partner_auth_events_identifier_created_idx on public.partner_auth_events(identifier, created_at desc);
create index if not exists tickets_partner_active_idx on public.tickets(partner_id, partner_location_id, status, updated_at desc) where partner_id is not null;

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at before update on public.partners for each row execute function public.set_updated_at();
drop trigger if exists set_partner_locations_updated_at on public.partner_locations;
create trigger set_partner_locations_updated_at before update on public.partner_locations for each row execute function public.set_updated_at();
drop trigger if exists set_partner_users_updated_at on public.partner_users;
create trigger set_partner_users_updated_at before update on public.partner_users for each row execute function public.set_updated_at();
drop trigger if exists set_partner_appointments_updated_at on public.partner_appointments;
create trigger set_partner_appointments_updated_at before update on public.partner_appointments for each row execute function public.set_updated_at();
drop trigger if exists set_purchases_updated_at on public.purchases;
create trigger set_purchases_updated_at before update on public.purchases for each row execute function public.set_updated_at();

-- Credentials are only checked from server routes using the service role. The
-- verifier updates last_login_at but deliberately returns the same generic
-- empty result for non-existent, suspended and wrong-password users.
create or replace function public.verify_partner_credentials(p_code text, p_password text)
returns table (
  id uuid,
  partner_id uuid,
  location_id uuid,
  name text,
  role text,
  session_version integer
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user record;
begin
  select pu.id, pu.partner_id, pu.location_id, pu.name, pu.role, pu.session_version
  into v_user
  from public.partner_users pu
  join public.partners p on p.id = pu.partner_id and p.active
  left join public.partner_locations location on location.id = pu.location_id
  where pu.code = btrim(p_code)
    and pu.active
    and (pu.location_id is null or location.active)
    and pu.password_hash = extensions.crypt(p_password, pu.password_hash)
  limit 1;

  if not found then
    return;
  end if;

  update public.partner_users set last_login_at = now() where partner_users.id = v_user.id;
  return query select v_user.id, v_user.partner_id, v_user.location_id, v_user.name, v_user.role, v_user.session_version;
end;
$$;

create or replace function public.record_partner_auth_event(
  p_identifier text,
  p_successful boolean,
  p_partner_user_id uuid default null,
  p_remote_address text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.partner_auth_events (identifier, successful, partner_user_id, remote_address)
  values (left(coalesce(nullif(btrim(p_identifier), ''), 'unknown'), 64), p_successful, p_partner_user_id, nullif(left(coalesce(p_remote_address, ''), 120), ''));
$$;

create or replace function public.admin_create_partner_user(
  p_partner_id uuid,
  p_location_id uuid,
  p_name text,
  p_code text,
  p_password text,
  p_role text,
  p_active boolean default true
)
returns table (
  id uuid,
  partner_id uuid,
  location_id uuid,
  name text,
  code text,
  role text,
  active boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text := btrim(p_name);
  v_code text := btrim(p_code);
  v_password text := p_password;
begin
  if not exists (select 1 from public.partners where partners.id = p_partner_id) then
    raise exception using errcode = 'P0002', message = 'El partner no existe.';
  end if;
  if p_location_id is not null and not exists (
    select 1 from public.partner_locations where partner_locations.id = p_location_id and partner_locations.partner_id = p_partner_id
  ) then
    raise exception using errcode = '22023', message = 'La sucursal no pertenece al partner.';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'El nombre debe tener entre 2 y 80 caracteres.';
  end if;
  if v_code is null or v_code !~ '^[A-Za-z0-9_-]{3,64}$' then
    raise exception using errcode = '22023', message = 'El código no es válido.';
  end if;
  if v_password is null or char_length(v_password) not between 8 and 256 or v_password !~ '[A-Za-z]' or v_password !~ '[0-9]' then
    raise exception using errcode = '22023', message = 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
  end if;
  if p_role not in ('owner', 'manager', 'buyer') then
    raise exception using errcode = '22023', message = 'El rol no es válido.';
  end if;

  return query
  insert into public.partner_users (partner_id, location_id, name, code, password_hash, role, active)
  values (p_partner_id, p_location_id, v_name, v_code, extensions.crypt(v_password, extensions.gen_salt('bf', 12)), p_role, coalesce(p_active, true))
  returning partner_users.id, partner_users.partner_id, partner_users.location_id, partner_users.name, partner_users.code, partner_users.role, partner_users.active, partner_users.last_login_at, partner_users.created_at, partner_users.updated_at;
end;
$$;

create or replace function public.admin_update_partner_user(
  p_id uuid,
  p_location_id uuid,
  p_name text,
  p_code text,
  p_password text default null,
  p_role text default 'buyer',
  p_active boolean default true
)
returns table (
  id uuid,
  partner_id uuid,
  location_id uuid,
  name text,
  code text,
  role text,
  active boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_existing public.partner_users%rowtype;
  v_name text := btrim(p_name);
  v_code text := btrim(p_code);
  v_password text := nullif(p_password, '');
begin
  select * into v_existing from public.partner_users where partner_users.id = p_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'El usuario partner no existe.';
  end if;
  if p_location_id is not null and not exists (
    select 1 from public.partner_locations where partner_locations.id = p_location_id and partner_locations.partner_id = v_existing.partner_id
  ) then
    raise exception using errcode = '22023', message = 'La sucursal no pertenece al partner.';
  end if;
  if v_name is null or char_length(v_name) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'El nombre debe tener entre 2 y 80 caracteres.';
  end if;
  if v_code is null or v_code !~ '^[A-Za-z0-9_-]{3,64}$' then
    raise exception using errcode = '22023', message = 'El código no es válido.';
  end if;
  if v_password is not null and (char_length(v_password) not between 8 and 256 or v_password !~ '[A-Za-z]' or v_password !~ '[0-9]') then
    raise exception using errcode = '22023', message = 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
  end if;
  if p_role not in ('owner', 'manager', 'buyer') then
    raise exception using errcode = '22023', message = 'El rol no es válido.';
  end if;

  return query
  update public.partner_users pu
  set
    location_id = p_location_id,
    name = v_name,
    code = v_code,
    password_hash = case when v_password is null then pu.password_hash else extensions.crypt(v_password, extensions.gen_salt('bf', 12)) end,
    role = p_role,
    active = coalesce(p_active, true),
    session_version = case
      when v_password is not null or pu.active is distinct from coalesce(p_active, true) or pu.location_id is distinct from p_location_id or pu.role is distinct from p_role
        then pu.session_version + 1
      else pu.session_version
    end
  where pu.id = p_id
  returning pu.id, pu.partner_id, pu.location_id, pu.name, pu.code, pu.role, pu.active, pu.last_login_at, pu.created_at, pu.updated_at;
end;
$$;

create or replace function public.schedule_partner_appointment(
  p_ticket_id text,
  p_advisor_id text,
  p_partner_id uuid,
  p_location_id uuid,
  p_scheduled_at timestamptz,
  p_notes text default null
)
returns table (appointment_id uuid, ticket_id text, scheduled_at timestamptz, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.tickets%rowtype;
  v_appointment_id uuid;
  v_replaced boolean := false;
  v_replaced_count integer := 0;
begin
  if p_scheduled_at is null then
    raise exception using errcode = '22023', message = 'La fecha y hora de la cita son obligatorias.';
  end if;
  select * into v_ticket from public.tickets where tickets.id::text = btrim(p_ticket_id) for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'El ticket no existe.';
  end if;
  if coalesce(v_ticket.advisor_id::text, '') <> btrim(p_advisor_id) then
    raise exception using errcode = '42501', message = 'Este asesor no puede programar ese ticket.';
  end if;
  if coalesce(v_ticket.status, 'nuevo') in ('compra-realizada', 'cancelado', 'archivado', 'no-concretado') then
    raise exception using errcode = '22023', message = 'El ticket ya no admite una cita.';
  end if;
  if not exists (
    select 1 from public.partner_locations location
    join public.partners partner on partner.id = location.partner_id
    where location.id = p_location_id and location.partner_id = p_partner_id and location.active and partner.active
  ) then
    raise exception using errcode = '22023', message = 'El partner o la sucursal no están disponibles.';
  end if;

  update public.partner_appointments
  set status = 'reprogramada'
  where ticket_id = v_ticket.id
    and status in ('programada', 'pendiente-confirmacion');
  get diagnostics v_replaced_count = row_count;
  v_replaced := v_replaced_count > 0;

  insert into public.partner_appointments (ticket_id, partner_id, location_id, scheduled_at, status, created_by_advisor_id, notes)
  values (v_ticket.id, p_partner_id, p_location_id, p_scheduled_at, 'programada', btrim(p_advisor_id), nullif(btrim(p_notes), ''))
  returning id into v_appointment_id;

  update public.tickets
  set partner_id = p_partner_id,
      partner_location_id = p_location_id,
      status = 'cita-programada',
      closed_at = null,
      updated_at = now()
  where id = v_ticket.id;

  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (
    v_ticket.id,
    case when v_replaced then 'appointment_rescheduled' else 'appointment_scheduled' end,
    'advisor', btrim(p_advisor_id), null,
    jsonb_build_object('appointment_id', v_appointment_id, 'partner_id', p_partner_id, 'location_id', p_location_id, 'scheduled_at', p_scheduled_at)
  );

  return query select v_appointment_id, v_ticket.id::text, p_scheduled_at, 'programada'::text;
end;
$$;

create or replace function public.partner_confirm_purchase(
  p_ticket_id text,
  p_appointment_id uuid,
  p_partner_user_id uuid,
  p_metal text,
  p_purity text,
  p_gross_weight_grams numeric,
  p_net_weight_grams numeric,
  p_price_per_gram numeric,
  p_total_paid numeric,
  p_total_explanation text,
  p_payment_method text,
  p_payment_reference text default null,
  p_employee_name text default null,
  p_notes text default null,
  p_receipt_url text default null,
  p_confirmed_at timestamptz default now()
)
returns table (purchase_id uuid, ticket_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.partner_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_appointment public.partner_appointments%rowtype;
  v_purchase_id uuid;
  v_calculated_total numeric(14, 2);
begin
  select * into v_user from public.partner_users where partner_users.id = p_partner_user_id for share;
  if not found or not v_user.active or not exists (select 1 from public.partners where partners.id = v_user.partner_id and partners.active) then
    raise exception using errcode = '42501', message = 'El acceso del partner ya no está activo.';
  end if;
  if v_user.location_id is not null and not exists (select 1 from public.partner_locations where partner_locations.id = v_user.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal del usuario no está activa.';
  end if;
  select * into v_ticket from public.tickets where tickets.id::text = btrim(p_ticket_id) for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'El ticket no existe.';
  end if;
  if v_ticket.partner_id is distinct from v_user.partner_id or (v_user.location_id is not null and v_ticket.partner_location_id is distinct from v_user.location_id) then
    raise exception using errcode = '42501', message = 'El usuario partner no tiene acceso a este ticket.';
  end if;
  select * into v_appointment from public.partner_appointments
  where partner_appointments.id = p_appointment_id and partner_appointments.ticket_id = v_ticket.id
  for update;
  if not found or v_appointment.partner_id <> v_user.partner_id or (v_user.location_id is not null and v_appointment.location_id <> v_user.location_id) then
    raise exception using errcode = '42501', message = 'La cita no pertenece a este usuario partner.';
  end if;
  if not exists (select 1 from public.partner_locations where partner_locations.id = v_appointment.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal de la cita no está activa.';
  end if;
  if v_appointment.status not in ('programada', 'pendiente-confirmacion') then
    raise exception using errcode = '22023', message = 'La cita ya tiene un resultado y no puede confirmar una compra.';
  end if;
  if coalesce(v_ticket.status, 'nuevo') in ('compra-realizada', 'cancelado', 'archivado') then
    raise exception using errcode = '22023', message = 'El ticket no admite confirmar una compra.';
  end if;
  if p_gross_weight_grams is null or p_net_weight_grams is null or p_price_per_gram is null or p_total_paid is null
    or p_gross_weight_grams <= 0 or p_net_weight_grams <= 0 or p_net_weight_grams > p_gross_weight_grams or p_price_per_gram < 0 or p_total_paid < 0 then
    raise exception using errcode = '22023', message = 'Los importes o pesos de la compra no son válidos.';
  end if;
  if p_payment_method not in ('cash', 'check', 'zelle', 'venmo', 'bank_transfer', 'other') then
    raise exception using errcode = '22023', message = 'El método de pago no es válido.';
  end if;
  v_calculated_total := round(p_net_weight_grams * p_price_per_gram, 2);
  if abs(p_total_paid - v_calculated_total) > 0.01 and coalesce(nullif(btrim(p_total_explanation), ''), '') = '' then
    raise exception using errcode = '22023', message = 'Explica la diferencia entre el total calculado y el total pagado.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_ticket.id::text));
  if exists (select 1 from public.purchases where purchases.ticket_id = v_ticket.id) then
    raise exception using errcode = '23505', message = 'Ya existe una compra registrada para este ticket.';
  end if;

  insert into public.purchases (
    ticket_id, appointment_id, partner_id, location_id, confirmed_by_partner_user_id,
    metal, purity, gross_weight_grams, net_weight_grams, price_per_gram, calculated_total, total_paid,
    total_explanation, payment_method, payment_reference, employee_name, notes, receipt_url, confirmed_at
  ) values (
    v_ticket.id, v_appointment.id, v_user.partner_id, v_appointment.location_id, v_user.id,
    btrim(p_metal), btrim(p_purity), p_gross_weight_grams, p_net_weight_grams, p_price_per_gram, v_calculated_total, p_total_paid,
    nullif(btrim(p_total_explanation), ''), p_payment_method, nullif(btrim(p_payment_reference), ''), nullif(btrim(p_employee_name), ''), nullif(btrim(p_notes), ''), nullif(btrim(p_receipt_url), ''), coalesce(p_confirmed_at, now())
  ) returning id into v_purchase_id;

  insert into public.purchase_items (purchase_id, metal, purity, gross_weight_grams, net_weight_grams, price_per_gram, calculated_total, total_paid)
  values (v_purchase_id, btrim(p_metal), btrim(p_purity), p_gross_weight_grams, p_net_weight_grams, p_price_per_gram, v_calculated_total, p_total_paid);

  update public.partner_appointments set status = 'completada' where id = v_appointment.id;
  update public.tickets set status = 'compra-realizada', closed_at = coalesce(p_confirmed_at, now()), updated_at = now() where id = v_ticket.id;
  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (v_ticket.id, 'purchase_confirmed', 'partner_user', v_user.id::text, v_user.name, jsonb_build_object('purchase_id', v_purchase_id, 'total_paid', p_total_paid, 'calculated_total', v_calculated_total));

  return query select v_purchase_id, v_ticket.id::text, 'compra-realizada'::text;
end;
$$;

create or replace function public.partner_record_outcome(
  p_ticket_id text,
  p_appointment_id uuid,
  p_partner_user_id uuid,
  p_outcome text,
  p_notes text default null,
  p_rescheduled_at timestamptz default null
)
returns table (ticket_id text, status text, appointment_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.partner_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_appointment public.partner_appointments%rowtype;
  v_next_appointment_id uuid;
  v_status text;
  v_appointment_status text;
begin
  if p_outcome not in ('no_show', 'rejected_offer', 'not_authentic', 'purity_mismatch', 'price_disagreement', 'return_later', 'rescheduled', 'requirements_not_met', 'duplicate_ticket', 'other') then
    raise exception using errcode = '22023', message = 'El resultado no es válido.';
  end if;
  select * into v_user from public.partner_users where partner_users.id = p_partner_user_id for share;
  if not found or not v_user.active or not exists (select 1 from public.partners where partners.id = v_user.partner_id and partners.active) then
    raise exception using errcode = '42501', message = 'El acceso del partner ya no está activo.';
  end if;
  if v_user.location_id is not null and not exists (select 1 from public.partner_locations where partner_locations.id = v_user.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal del usuario no está activa.';
  end if;
  select * into v_ticket from public.tickets where tickets.id::text = btrim(p_ticket_id) for update;
  if not found or v_ticket.partner_id is distinct from v_user.partner_id or (v_user.location_id is not null and v_ticket.partner_location_id is distinct from v_user.location_id) then
    raise exception using errcode = '42501', message = 'El usuario partner no tiene acceso a este ticket.';
  end if;
  if coalesce(v_ticket.status, 'nuevo') in ('compra-realizada', 'cancelado', 'archivado') then
    raise exception using errcode = '22023', message = 'El ticket ya no admite este resultado.';
  end if;
  select * into v_appointment from public.partner_appointments where id = p_appointment_id and ticket_id = v_ticket.id for update;
  if not found or v_appointment.partner_id <> v_user.partner_id or (v_user.location_id is not null and v_appointment.location_id <> v_user.location_id) then
    raise exception using errcode = '42501', message = 'La cita no pertenece a este usuario partner.';
  end if;
  if not exists (select 1 from public.partner_locations where partner_locations.id = v_appointment.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal de la cita no está activa.';
  end if;
  if v_appointment.status not in ('programada', 'pendiente-confirmacion') then
    raise exception using errcode = '22023', message = 'La cita ya tiene un resultado.';
  end if;

  if p_outcome = 'rescheduled' then
    if p_rescheduled_at is null then
      raise exception using errcode = '22023', message = 'Indica la nueva fecha y hora de la cita.';
    end if;
    update public.partner_appointments set status = 'reprogramada' where id = v_appointment.id;
    insert into public.partner_appointments (ticket_id, partner_id, location_id, scheduled_at, status, created_by_advisor_id, notes)
    values (v_ticket.id, v_appointment.partner_id, v_appointment.location_id, p_rescheduled_at, 'programada', v_appointment.created_by_advisor_id, nullif(btrim(p_notes), ''))
    returning id into v_next_appointment_id;
    v_status := 'cita-programada';
    v_appointment_status := 'reprogramada';
  elsif p_outcome = 'no_show' then
    update public.partner_appointments set status = 'no-asistio' where id = v_appointment.id;
    v_status := 'en-negociacion';
    v_appointment_status := 'no-asistio';
    v_next_appointment_id := v_appointment.id;
  elsif p_outcome in ('not_authentic', 'purity_mismatch', 'requirements_not_met') then
    update public.partner_appointments set status = 'no-concretada' where id = v_appointment.id;
    v_status := 'no-concretado';
    v_appointment_status := 'no-concretada';
    v_next_appointment_id := v_appointment.id;
  elsif p_outcome in ('duplicate_ticket', 'other') then
    update public.partner_appointments set status = 'en-revision' where id = v_appointment.id;
    v_status := 'en-revision';
    v_appointment_status := 'en-revision';
    v_next_appointment_id := v_appointment.id;
  else
    update public.partner_appointments set status = 'no-concretada' where id = v_appointment.id;
    v_status := 'en-negociacion';
    v_appointment_status := 'no-concretada';
    v_next_appointment_id := v_appointment.id;
  end if;

  update public.tickets
  set status = v_status,
      closed_at = case when v_status = 'no-concretado' then now() else null end,
      updated_at = now()
  where id = v_ticket.id;
  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (v_ticket.id, 'partner_outcome_recorded', 'partner_user', v_user.id::text, v_user.name, jsonb_build_object('outcome', p_outcome, 'appointment_status', v_appointment_status, 'notes', nullif(btrim(p_notes), ''), 'new_appointment_id', v_next_appointment_id));

  return query select v_ticket.id::text, v_status, v_next_appointment_id;
end;
$$;

create or replace function public.partner_report_problem(
  p_ticket_id text,
  p_appointment_id uuid,
  p_partner_user_id uuid,
  p_category text,
  p_notes text
)
returns table (ticket_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.partner_users%rowtype;
  v_ticket public.tickets%rowtype;
  v_appointment public.partner_appointments%rowtype;
begin
  select * into v_user from public.partner_users where partner_users.id = p_partner_user_id for share;
  if not found or not v_user.active or not exists (select 1 from public.partners where partners.id = v_user.partner_id and partners.active) then
    raise exception using errcode = '42501', message = 'El acceso del partner ya no está activo.';
  end if;
  if v_user.location_id is not null and not exists (select 1 from public.partner_locations where partner_locations.id = v_user.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal del usuario no está activa.';
  end if;
  select * into v_ticket from public.tickets where tickets.id::text = btrim(p_ticket_id) for update;
  if not found or v_ticket.partner_id is distinct from v_user.partner_id or (v_user.location_id is not null and v_ticket.partner_location_id is distinct from v_user.location_id) then
    raise exception using errcode = '42501', message = 'El usuario partner no tiene acceso a este ticket.';
  end if;
  select * into v_appointment from public.partner_appointments where id = p_appointment_id and ticket_id = v_ticket.id for update;
  if not found or v_appointment.partner_id <> v_user.partner_id or (v_user.location_id is not null and v_appointment.location_id <> v_user.location_id) then
    raise exception using errcode = '42501', message = 'La cita no pertenece a este usuario partner.';
  end if;
  if not exists (select 1 from public.partner_locations where partner_locations.id = v_appointment.location_id and partner_locations.active) then
    raise exception using errcode = '42501', message = 'La sucursal de la cita no está activa.';
  end if;
  if v_appointment.status in ('completada', 'cancelada') then
    raise exception using errcode = '22023', message = 'La cita ya no admite un reporte de problema.';
  end if;

  update public.partner_appointments set status = 'en-revision' where id = v_appointment.id;
  update public.tickets set status = 'en-revision', closed_at = null, updated_at = now() where id = v_ticket.id;
  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (v_ticket.id, 'partner_problem_reported', 'partner_user', v_user.id::text, v_user.name, jsonb_build_object('category', btrim(p_category), 'notes', btrim(p_notes)));
  return query select v_ticket.id::text, 'en-revision'::text;
end;
$$;

create or replace function public.admin_void_purchase(
  p_purchase_id uuid,
  p_reason text,
  p_actor_name text default 'Administrador'
)
returns table (ticket_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
begin
  if char_length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception using errcode = '22023', message = 'Indica un motivo de anulación entre 5 y 1000 caracteres.';
  end if;
  select * into v_purchase from public.purchases where purchases.id = p_purchase_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'La compra no existe.';
  end if;
  if v_purchase.voided_at is not null then
    raise exception using errcode = '22023', message = 'La compra ya fue anulada.';
  end if;
  update public.purchases
  set voided_at = now(), void_reason = btrim(p_reason), voided_by_actor_id = 'admin', voided_by_actor_name = coalesce(nullif(btrim(p_actor_name), ''), 'Administrador')
  where id = v_purchase.id;
  update public.partner_appointments set status = 'en-revision' where id = v_purchase.appointment_id;
  update public.tickets set status = 'en-revision', closed_at = null, updated_at = now() where id = v_purchase.ticket_id;
  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (v_purchase.ticket_id, 'purchase_voided', 'admin', 'admin', coalesce(nullif(btrim(p_actor_name), ''), 'Administrador'), jsonb_build_object('purchase_id', v_purchase.id, 'reason', btrim(p_reason)));
  return query select v_purchase.ticket_id::text, 'en-revision'::text;
end;
$$;

create or replace function public.admin_correct_purchase(
  p_purchase_id uuid,
  p_total_paid numeric,
  p_notes text,
  p_reason text,
  p_actor_name text default 'Administrador'
)
returns table (id uuid, total_paid numeric, notes text, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_new_notes text := nullif(btrim(p_notes), '');
begin
  if p_total_paid is null or p_total_paid < 0 then
    raise exception using errcode = '22023', message = 'El total pagado no es válido.';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) not between 5 and 1000 then
    raise exception using errcode = '22023', message = 'Indica el motivo de la corrección.';
  end if;
  select * into v_purchase from public.purchases where purchases.id = p_purchase_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'La compra no existe.';
  end if;
  if v_purchase.voided_at is not null then
    raise exception using errcode = '22023', message = 'No se puede corregir una compra anulada.';
  end if;
  insert into public.purchase_corrections (purchase_id, reason, previous_values, changed_values, corrected_by_actor_id, corrected_by_actor_name)
  values (
    v_purchase.id, btrim(p_reason),
    jsonb_build_object('total_paid', v_purchase.total_paid, 'notes', v_purchase.notes),
    jsonb_build_object('total_paid', p_total_paid, 'notes', v_new_notes),
    'admin', coalesce(nullif(btrim(p_actor_name), ''), 'Administrador')
  );
  update public.purchases set total_paid = p_total_paid, notes = v_new_notes where id = v_purchase.id;
  insert into public.partner_ticket_events (ticket_id, event_type, actor_type, actor_id, actor_name, details)
  values (v_purchase.ticket_id, 'purchase_corrected', 'admin', 'admin', coalesce(nullif(btrim(p_actor_name), ''), 'Administrador'), jsonb_build_object('purchase_id', v_purchase.id, 'reason', btrim(p_reason)));
  return query select p.id, p.total_paid, p.notes, p.updated_at from public.purchases p where p.id = v_purchase.id;
end;
$$;

-- Referral reports count a confirmed, non-voided purchase as the source of
-- truth. Historical tickets from before this migration still count from their
-- existing compra-realizada status, so prior reporting remains intact.
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
    select ra.advisor_id, count(*)::bigint as unique_visitors,
      (count(*) filter (where ra.registered_at is not null))::bigint as registered_leads
    from public.referral_attributions ra
    group by ra.advisor_id
  ) attribution_stats on attribution_stats.advisor_id = a.id::text
  left join (
    select t.referrer_advisor_id,
      count(*)::bigint as tickets_created,
      (count(*) filter (where (p.id is not null and p.voided_at is null) or (p.id is null and t.status = 'compra-realizada')))::bigint as purchases_completed
    from public.tickets t
    left join public.purchases p on p.ticket_id = t.id
    where t.referrer_advisor_id is not null
    group by t.referrer_advisor_id
  ) ticket_stats on ticket_stats.referrer_advisor_id = a.id::text
  order by a.name asc;
$$;

create or replace function public.admin_partner_report()
returns table (
  partner_id uuid,
  locations_count bigint,
  users_count bigint,
  pending_appointments bigint,
  confirmed_purchases bigint,
  no_concretadas bigint,
  problems_in_review bigint,
  volume_grams numeric,
  total_paid numeric,
  last_login_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    partner.id,
    (select count(*)::bigint from public.partner_locations location where location.partner_id = partner.id),
    (select count(*)::bigint from public.partner_users partner_user where partner_user.partner_id = partner.id),
    (select count(*)::bigint from public.partner_appointments appointment where appointment.partner_id = partner.id and appointment.status in ('programada', 'pendiente-confirmacion')),
    (select count(*)::bigint from public.purchases purchase where purchase.partner_id = partner.id and purchase.voided_at is null),
    (select count(*)::bigint from public.tickets ticket where ticket.partner_id = partner.id and ticket.status = 'no-concretado'),
    (select count(*)::bigint from public.tickets ticket where ticket.partner_id = partner.id and ticket.status = 'en-revision'),
    coalesce((select sum(purchase.net_weight_grams) from public.purchases purchase where purchase.partner_id = partner.id and purchase.voided_at is null), 0::numeric),
    coalesce((select sum(purchase.total_paid) from public.purchases purchase where purchase.partner_id = partner.id and purchase.voided_at is null), 0::numeric),
    (select max(partner_user.last_login_at) from public.partner_users partner_user where partner_user.partner_id = partner.id)
  from public.partners partner
  order by partner.name asc;
$$;

create or replace function public.advisor_referral_purchase_count(p_advisor_id text)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.tickets t
  left join public.purchases p on p.ticket_id = t.id
  where t.referrer_advisor_id = btrim(p_advisor_id)
    and ((p.id is not null and p.voided_at is null) or (p.id is null and t.status = 'compra-realizada'));
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'partners', 'partner_locations', 'partner_users', 'partner_appointments',
    'purchases', 'purchase_items', 'purchase_corrections', 'partner_ticket_events', 'partner_auth_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end;
$$;

revoke all on function public.verify_partner_credentials(text, text) from public, anon, authenticated;
revoke all on function public.record_partner_auth_event(text, boolean, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_create_partner_user(uuid, uuid, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.admin_update_partner_user(uuid, uuid, text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.schedule_partner_appointment(text, text, uuid, uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.partner_confirm_purchase(text, uuid, uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.partner_record_outcome(text, uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.partner_report_problem(text, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_void_purchase(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_correct_purchase(uuid, numeric, text, text, text) from public, anon, authenticated;
revoke all on function public.advisor_referral_purchase_count(text) from public, anon, authenticated;
revoke all on function public.admin_partner_report() from public, anon, authenticated;

grant execute on function public.verify_partner_credentials(text, text) to service_role;
grant execute on function public.record_partner_auth_event(text, boolean, uuid, text) to service_role;
grant execute on function public.admin_create_partner_user(uuid, uuid, text, text, text, text, boolean) to service_role;
grant execute on function public.admin_update_partner_user(uuid, uuid, text, text, text, text, boolean) to service_role;
grant execute on function public.schedule_partner_appointment(text, text, uuid, uuid, timestamptz, text) to service_role;
grant execute on function public.partner_confirm_purchase(text, uuid, uuid, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.partner_record_outcome(text, uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.partner_report_problem(text, uuid, uuid, text, text) to service_role;
grant execute on function public.admin_void_purchase(uuid, text, text) to service_role;
grant execute on function public.admin_correct_purchase(uuid, numeric, text, text, text) to service_role;
grant execute on function public.advisor_referral_purchase_count(text) to service_role;
grant execute on function public.admin_partner_report() to service_role;

commit;
