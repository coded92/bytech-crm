-- BYTECH CRM Settings Sessions Backend Foundation
-- Purpose:
--   Add a real CRM-owned active-session registry for the Settings > Sessions
--   workspace. This complements user_session_events, which remains an
--   append-only activity log.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   This does not expose or store Supabase access/refresh tokens.

create table if not exists public.user_active_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_identifier text not null,
  device_type text null,
  browser text null,
  os text null,
  ip_address text null,
  location text null,
  user_agent text null,
  status text not null default 'active',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  signed_out_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_active_sessions_status_check
    check (status in ('active', 'signed_out', 'expired', 'revoked')),
  constraint user_active_sessions_identifier_not_blank
    check (length(trim(session_identifier)) > 0),
  constraint user_active_sessions_unique_session
    unique (user_id, session_identifier)
);

comment on table public.user_active_sessions is
  'Current CRM session registry for profile/session settings. Stores hashed identifiers only, never Supabase tokens.';
comment on column public.user_active_sessions.session_identifier is
  'Stable hashed CRM browser-session identifier. Do not store raw tokens or raw cookie values here.';
comment on column public.user_active_sessions.status is
  'CRM session status. Revocation enforcement must be handled by app middleware/layout logic.';

create index if not exists idx_user_active_sessions_user_status
on public.user_active_sessions(user_id, status, last_seen_at desc);

create index if not exists idx_user_active_sessions_user_last_seen
on public.user_active_sessions(user_id, last_seen_at desc);

drop trigger if exists trg_user_active_sessions_updated_at
on public.user_active_sessions;

create trigger trg_user_active_sessions_updated_at
before update on public.user_active_sessions
for each row
execute function public.set_settings_admin_updated_at();

alter table public.user_active_sessions enable row level security;

drop policy if exists "active sessions select own or admin"
on public.user_active_sessions;
drop policy if exists "active sessions insert own"
on public.user_active_sessions;
drop policy if exists "active sessions update own"
on public.user_active_sessions;

create policy "active sessions select own or admin"
on public.user_active_sessions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "active sessions insert own"
on public.user_active_sessions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "active sessions update own"
on public.user_active_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update
on public.user_active_sessions
to authenticated;
