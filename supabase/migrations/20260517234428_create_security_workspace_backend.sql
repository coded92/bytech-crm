-- BYTECH CRM Settings Security Backend Foundation
-- Purpose:
--   Add real CRM-owned backend support for the Settings > Security workspace:
--   security preferences, trusted-device metadata, security questions,
--   recovery contacts, 2FA metadata, and backup-code storage.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   This does not fake Supabase MFA enrollment, SMS delivery, or device control.
--   Provider-specific security workflows must still call Supabase Auth APIs.

alter table public.user_security_events
  drop constraint if exists user_security_events_event_type_check;

alter table public.user_security_events
  add constraint user_security_events_event_type_check
  check (event_type in (
    'login',
    'logout',
    'password_reset',
    'password_changed',
    'profile_updated',
    'avatar_updated',
    'preferences_updated',
    'notification_preferences_updated',
    'general_settings_updated',
    'company_settings_updated',
    'security_settings_updated',
    'security_questions_updated',
    'recovery_contact_updated',
    'two_factor_enabled',
    'two_factor_disabled',
    'backup_codes_generated',
    'trusted_device_updated',
    'login_alert_sent',
    'unusual_signin_detected'
  ));

comment on constraint user_security_events_event_type_check
on public.user_security_events is
  'Security event types used by CRM account/security settings. This is an append-only event log.';

create table if not exists public.user_security_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  login_alerts_enabled boolean not null default true,
  alert_new_device_signins boolean not null default true,
  alert_new_location_signins boolean not null default true,
  alert_unusual_signin_attempts boolean not null default true,
  alert_successful_signins boolean not null default true,
  alert_email_enabled boolean not null default true,
  alert_sms_enabled boolean not null default false,
  alert_frequency text not null default 'instant',
  alert_tone text not null default 'default',
  password_expiry_reminder_enabled boolean not null default true,
  session_timeout_minutes integer not null default 30,
  restrict_login_by_ip boolean not null default false,
  require_2fa_for_all_logins boolean not null default false,
  security_questions_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_security_settings_alert_frequency_check
    check (alert_frequency in ('instant', 'daily', 'weekly')),
  constraint user_security_settings_alert_tone_check
    check (alert_tone in ('default', 'subtle', 'urgent')),
  constraint user_security_settings_session_timeout_check
    check (session_timeout_minutes between 5 and 1440)
);

comment on table public.user_security_settings is
  'Per-user security preferences for login alerts, session behavior, and security UI state.';
comment on column public.user_security_settings.restrict_login_by_ip is
  'Preference only until an explicit trusted-IP enforcement policy is implemented.';
comment on column public.user_security_settings.require_2fa_for_all_logins is
  'Preference only until Supabase MFA enrollment/enforcement is fully integrated.';

create table if not exists public.user_2fa_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  provider text not null default 'totp',
  status text not null default 'not_configured',
  supabase_factor_id text null,
  enabled_at timestamptz null,
  disabled_at timestamptz null,
  last_verified_at timestamptz null,
  backup_codes_generated_at timestamptz null,
  backup_codes_remaining integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_2fa_settings_provider_check
    check (provider in ('totp')),
  constraint user_2fa_settings_status_check
    check (status in ('not_configured', 'pending', 'enabled', 'disabled')),
  constraint user_2fa_settings_backup_codes_remaining_check
    check (backup_codes_remaining >= 0)
);

comment on table public.user_2fa_settings is
  'CRM metadata for Supabase MFA state. This table does not store TOTP secrets.';
comment on column public.user_2fa_settings.supabase_factor_id is
  'Supabase Auth MFA factor id when a real provider enrollment exists.';

create table if not exists public.user_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_salt text not null,
  code_hash text not null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint user_backup_codes_hash_not_blank
    check (length(trim(code_hash)) > 0),
  constraint user_backup_codes_salt_not_blank
    check (length(trim(code_salt)) > 0)
);

comment on table public.user_backup_codes is
  'Hashed one-time backup codes for future MFA recovery. Raw codes must only be shown once by application code.';

create index if not exists idx_user_backup_codes_user_unused
on public.user_backup_codes(user_id, used_at)
where used_at is null;

create table if not exists public.user_recovery_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_type text not null,
  contact_value text not null,
  is_primary boolean not null default false,
  verification_status text not null default 'unverified',
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_recovery_contacts_contact_type_check
    check (contact_type in ('email', 'phone')),
  constraint user_recovery_contacts_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified')),
  constraint user_recovery_contacts_value_not_blank
    check (length(trim(contact_value)) > 0)
);

comment on table public.user_recovery_contacts is
  'User-managed recovery email and phone metadata for account recovery workflows.';

create unique index if not exists idx_user_recovery_contacts_one_primary_type
on public.user_recovery_contacts(user_id, contact_type)
where is_primary;

create index if not exists idx_user_recovery_contacts_user_type
on public.user_recovery_contacts(user_id, contact_type);

create table if not exists public.user_security_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  position integer not null,
  question text not null,
  answer_salt text not null,
  answer_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_security_questions_position_check
    check (position between 1 and 5),
  constraint user_security_questions_question_not_blank
    check (length(trim(question)) > 0),
  constraint user_security_questions_answer_hash_not_blank
    check (length(trim(answer_hash)) > 0),
  constraint user_security_questions_answer_salt_not_blank
    check (length(trim(answer_salt)) > 0),
  constraint user_security_questions_unique_position
    unique (user_id, position)
);

comment on table public.user_security_questions is
  'Hashed answers for optional account recovery questions. Plain answers are never stored.';

create index if not exists idx_user_security_questions_user_position
on public.user_security_questions(user_id, position);

alter table public.user_active_sessions
  add column if not exists trusted_status text not null default 'trusted',
  add column if not exists trusted_at timestamptz null,
  add column if not exists reviewed_at timestamptz null,
  add column if not exists is_2fa_verified boolean not null default false,
  add column if not exists last_2fa_verified_at timestamptz null;

alter table public.user_active_sessions
  drop constraint if exists user_active_sessions_trusted_status_check;

alter table public.user_active_sessions
  add constraint user_active_sessions_trusted_status_check
  check (trusted_status in ('trusted', 'unrecognized', 'review', 'blocked'));

comment on column public.user_active_sessions.trusted_status is
  'CRM trusted-device state for the Settings > Security trusted devices screen.';
comment on column public.user_active_sessions.is_2fa_verified is
  'Indicates whether the CRM has recorded MFA verification for this session after real MFA integration.';

create index if not exists idx_user_active_sessions_user_trusted
on public.user_active_sessions(user_id, trusted_status, last_seen_at desc);

drop trigger if exists trg_user_security_settings_updated_at
on public.user_security_settings;
create trigger trg_user_security_settings_updated_at
before update on public.user_security_settings
for each row
execute function public.set_settings_admin_updated_at();

drop trigger if exists trg_user_2fa_settings_updated_at
on public.user_2fa_settings;
create trigger trg_user_2fa_settings_updated_at
before update on public.user_2fa_settings
for each row
execute function public.set_settings_admin_updated_at();

drop trigger if exists trg_user_recovery_contacts_updated_at
on public.user_recovery_contacts;
create trigger trg_user_recovery_contacts_updated_at
before update on public.user_recovery_contacts
for each row
execute function public.set_settings_admin_updated_at();

drop trigger if exists trg_user_security_questions_updated_at
on public.user_security_questions;
create trigger trg_user_security_questions_updated_at
before update on public.user_security_questions
for each row
execute function public.set_settings_admin_updated_at();

alter table public.user_security_settings enable row level security;
alter table public.user_2fa_settings enable row level security;
alter table public.user_backup_codes enable row level security;
alter table public.user_recovery_contacts enable row level security;
alter table public.user_security_questions enable row level security;

drop policy if exists "security settings select own or admin"
on public.user_security_settings;
drop policy if exists "security settings insert own"
on public.user_security_settings;
drop policy if exists "security settings update own"
on public.user_security_settings;

create policy "security settings select own or admin"
on public.user_security_settings
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "security settings insert own"
on public.user_security_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "security settings update own"
on public.user_security_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "2fa settings select own or admin"
on public.user_2fa_settings;
drop policy if exists "2fa settings insert own"
on public.user_2fa_settings;
drop policy if exists "2fa settings update own"
on public.user_2fa_settings;

create policy "2fa settings select own or admin"
on public.user_2fa_settings
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "2fa settings insert own"
on public.user_2fa_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "2fa settings update own"
on public.user_2fa_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "backup codes select own or admin"
on public.user_backup_codes;
drop policy if exists "backup codes insert own"
on public.user_backup_codes;
drop policy if exists "backup codes update own"
on public.user_backup_codes;
drop policy if exists "backup codes delete own"
on public.user_backup_codes;

create policy "backup codes select own or admin"
on public.user_backup_codes
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "backup codes insert own"
on public.user_backup_codes
for insert
to authenticated
with check (user_id = auth.uid());

create policy "backup codes update own"
on public.user_backup_codes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "backup codes delete own"
on public.user_backup_codes
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "recovery contacts select own or admin"
on public.user_recovery_contacts;
drop policy if exists "recovery contacts insert own"
on public.user_recovery_contacts;
drop policy if exists "recovery contacts update own"
on public.user_recovery_contacts;
drop policy if exists "recovery contacts delete own"
on public.user_recovery_contacts;

create policy "recovery contacts select own or admin"
on public.user_recovery_contacts
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "recovery contacts insert own"
on public.user_recovery_contacts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "recovery contacts update own"
on public.user_recovery_contacts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "recovery contacts delete own"
on public.user_recovery_contacts
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "security questions select own or admin"
on public.user_security_questions;
drop policy if exists "security questions insert own"
on public.user_security_questions;
drop policy if exists "security questions update own"
on public.user_security_questions;
drop policy if exists "security questions delete own"
on public.user_security_questions;

create policy "security questions select own or admin"
on public.user_security_questions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "security questions insert own"
on public.user_security_questions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "security questions update own"
on public.user_security_questions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "security questions delete own"
on public.user_security_questions
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update
on public.user_security_settings
to authenticated;

grant select, insert, update
on public.user_2fa_settings
to authenticated;

revoke all
on public.user_backup_codes
from authenticated;

grant select (id, user_id, used_at, created_at)
on public.user_backup_codes
to authenticated;

grant insert (user_id, code_salt, code_hash, used_at)
on public.user_backup_codes
to authenticated;

grant update (used_at)
on public.user_backup_codes
to authenticated;

grant delete
on public.user_backup_codes
to authenticated;

grant select, insert, update, delete
on public.user_recovery_contacts
to authenticated;

revoke all
on public.user_security_questions
from authenticated;

grant select (id, user_id, position, question, created_at, updated_at)
on public.user_security_questions
to authenticated;

grant insert (user_id, position, question, answer_salt, answer_hash)
on public.user_security_questions
to authenticated;

grant update (position, question, answer_salt, answer_hash, updated_at)
on public.user_security_questions
to authenticated;

grant delete
on public.user_security_questions
to authenticated;
