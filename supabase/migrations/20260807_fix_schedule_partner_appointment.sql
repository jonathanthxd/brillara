-- Corrige la ambigüedad de ticket_id en instalaciones que ya ejecutaron
-- 20260806_partner_operations.sql.
begin;

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

  select * into v_ticket
  from public.tickets
  where tickets.id::text = btrim(p_ticket_id)
  for update;

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
    select 1
    from public.partner_locations location
    join public.partners partner on partner.id = location.partner_id
    where location.id = p_location_id
      and location.partner_id = p_partner_id
      and location.active
      and partner.active
  ) then
    raise exception using errcode = '22023', message = 'El partner o la sucursal no están disponibles.';
  end if;

  update public.partner_appointments as appointment
  set status = 'reprogramada'
  where appointment.ticket_id = v_ticket.id
    and appointment.status in ('programada', 'pendiente-confirmacion');
  get diagnostics v_replaced_count = row_count;
  v_replaced := v_replaced_count > 0;

  insert into public.partner_appointments (
    ticket_id, partner_id, location_id, scheduled_at, status, created_by_advisor_id, notes
  ) values (
    v_ticket.id, p_partner_id, p_location_id, p_scheduled_at, 'programada', btrim(p_advisor_id), nullif(btrim(p_notes), '')
  ) returning id into v_appointment_id;

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
    jsonb_build_object(
      'appointment_id', v_appointment_id,
      'partner_id', p_partner_id,
      'location_id', p_location_id,
      'scheduled_at', p_scheduled_at
    )
  );

  return query
  select v_appointment_id, v_ticket.id::text, p_scheduled_at, 'programada'::text;
end;
$$;

revoke all on function public.schedule_partner_appointment(text, text, uuid, uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.schedule_partner_appointment(text, text, uuid, uuid, timestamptz, text) to service_role;

commit;
