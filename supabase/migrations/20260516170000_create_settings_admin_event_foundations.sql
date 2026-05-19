-- BYTECH CRM Settings/Admin Backend Phase 1
-- Purpose:
--   Add real backend foundations for notification preferences, security
--   event history, and session activity logging.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   This does not implement fake 2FA, billing, connected apps, or device control.

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  event_type text not null,
  enabled boolean not null default true,
  digest_frequency text null,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time null,
  quiet_hours_end time null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_channel_check
    check (channel in ('email', 'in_app', 'sms')),
  constraint notification_preferences_event_type_check
    check (event_type in (
      'customer_updates',
      'project_updates',
      'invoice_alerts',
      'support_updates',
      'system_alerts'
    )),
  constraint notification_preferences_digest_frequency_check
    check (
      digest_frequency is null
      or digest_frequency in ('immediate', 'daily', 'weekly')
    ),
  constraint notification_preferences_unique_user_channel_event
    unique (user_id, channel, event_type)
);

create index if not exists idx_notification_preferences_user_id
on public.notification_preferences(user_id);

create index if not exists idx_notification_preferences_user_channel_event
on public.notification_preferences(user_id, channel, event_type);

create table if not exists public.user_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  ip_address text null,
  user_agent text null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  constraint user_security_events_event_type_check
    check (event_type in (
      'login',
      'logout',
      'password_reset',
      'password_changed',
      'profile_updated',
      'avatar_updated',
      'preferences_updated',
      'notification_preferences_updated'
    ))
);

create index if not exists idx_user_security_events_user_created
on public.user_security_events(user_id, created_at desc);

create index if not exists idx_user_security_events_event_type
on public.user_security_events(event_type);

create table if not exists public.user_session_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_identifier text not null,
  device_type text null,
  browser text null,
  os text null,
  ip_address text null,
  location text null,
  event_type text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint user_session_events_event_type_check
    check (event_type in ('login', 'logout', 'refresh'))
);

create index if not exists idx_user_session_events_user_created
on public.user_session_events(user_id, created_at desc);

create index if not exists idx_user_session_events_user_session
on public.user_session_events(user_id, session_identifier);

create or replace function public.set_settings_admin_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_notification_preferences_updated_at
on public.notification_preferences;

create trigger trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_settings_admin_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.user_security_events enable row level security;
alter table public.user_session_events enable row level security;

drop policy if exists "notification preferences select own or admin"
on public.notification_preferences;
drop policy if exists "notification preferences insert own"
on public.notification_preferences;
drop policy if exists "notification preferences update own"
on public.notification_preferences;
drop policy if exists "notification preferences delete own"
on public.notification_preferences;

create policy "notification preferences select own or admin"
on public.notification_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "notification preferences insert own"
on public.notification_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy "notification preferences update own"
on public.notification_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notification preferences delete own"
on public.notification_preferences
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "security events select own or admin"
on public.user_security_events;
drop policy if exists "security events insert own or admin"
on public.user_security_events;

create policy "security events select own or admin"
on public.user_security_events
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "security events insert own or admin"
on public.user_security_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

drop policy if exists "session events select own or admin"
on public.user_session_events;
drop policy if exists "session events insert own or admin"
on public.user_session_events;

create policy "session events select own or admin"
on public.user_session_events
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "session events insert own or admin"
on public.user_session_events
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

grant select, insert, update, delete
on public.notification_preferences
to authenticated;

grant select, insert
on public.user_security_events
to authenticated;

grant select, insert
on public.user_session_events
to authenticated;
