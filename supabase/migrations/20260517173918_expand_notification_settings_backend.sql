-- BYTECH CRM Settings Notifications Backend Expansion
-- Purpose:
--   Add real backend support for the notification settings screens:
--   expanded notification categories, per-channel delivery/preferences, and
--   SMS phone-number records.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   This migration stores preferences only; it does not implement fake email,
--   SMS, push delivery, credit purchase, or phone verification workflows.

alter table public.notification_preferences
  drop constraint if exists notification_preferences_event_type_check;

alter table public.notification_preferences
  add constraint notification_preferences_event_type_check
  check (event_type in (
    'customer_updates',
    'customer_activity',
    'project_updates',
    'task_assignments',
    'invoice_alerts',
    'payment_alerts',
    'field_job_updates',
    'inventory_alerts',
    'support_updates',
    'support_tickets',
    'system_alerts',
    'system_maintenance',
    'critical_alerts',
    'mentions_comments',
    'marketing_news'
  ));

comment on constraint notification_preferences_event_type_check
on public.notification_preferences is
  'Allowed CRM notification categories. Delivery behavior is controlled by channel settings.';

create table if not exists public.notification_channel_settings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  email_frequency text null default 'instant',
  email_format text null default 'html',
  digest_summary_enabled boolean not null default false,
  include_read_items boolean not null default false,
  browser_notifications_enabled boolean not null default false,
  play_sound boolean not null default true,
  show_unread_count boolean not null default true,
  sms_delivery_priority text null default 'high',
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time null,
  quiet_hours_end time null,
  timezone text null default 'Africa/Lagos',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, channel),
  constraint notification_channel_settings_channel_check
    check (channel in ('email', 'in_app', 'sms')),
  constraint notification_channel_settings_email_frequency_check
    check (
      email_frequency is null
      or email_frequency in ('instant', 'daily', 'weekly')
    ),
  constraint notification_channel_settings_email_format_check
    check (
      email_format is null
      or email_format in ('html', 'plain_text')
    ),
  constraint notification_channel_settings_sms_delivery_priority_check
    check (
      sms_delivery_priority is null
      or sms_delivery_priority in ('normal', 'high', 'critical')
    ),
  constraint notification_channel_settings_timezone_not_blank
    check (timezone is null or length(trim(timezone)) > 0)
);

comment on table public.notification_channel_settings is
  'Per-user notification channel behavior. Stores preferences only; providers must be integrated separately.';
comment on column public.notification_channel_settings.browser_notifications_enabled is
  'Preference for browser notifications. This does not create push subscriptions by itself.';
comment on column public.notification_channel_settings.sms_delivery_priority is
  'Preferred SMS priority. This does not buy credits or send SMS.';

create table if not exists public.notification_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone_number text not null,
  label text not null default 'Primary Number',
  is_primary boolean not null default false,
  verification_status text not null default 'unverified',
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_phone_numbers_phone_not_blank
    check (length(trim(phone_number)) > 0),
  constraint notification_phone_numbers_label_not_blank
    check (length(trim(label)) > 0),
  constraint notification_phone_numbers_verification_status_check
    check (verification_status in ('unverified', 'pending', 'verified'))
);

comment on table public.notification_phone_numbers is
  'User-owned phone numbers for future SMS notifications. Verification workflow is not implemented by this table.';

create unique index if not exists idx_notification_phone_numbers_one_primary
on public.notification_phone_numbers(user_id)
where is_primary;

create index if not exists idx_notification_phone_numbers_user_id
on public.notification_phone_numbers(user_id);

create index if not exists idx_notification_phone_numbers_status
on public.notification_phone_numbers(user_id, verification_status);

drop trigger if exists trg_notification_channel_settings_updated_at
on public.notification_channel_settings;

create trigger trg_notification_channel_settings_updated_at
before update on public.notification_channel_settings
for each row
execute function public.set_settings_admin_updated_at();

drop trigger if exists trg_notification_phone_numbers_updated_at
on public.notification_phone_numbers;

create trigger trg_notification_phone_numbers_updated_at
before update on public.notification_phone_numbers
for each row
execute function public.set_settings_admin_updated_at();

alter table public.notification_channel_settings enable row level security;
alter table public.notification_phone_numbers enable row level security;

drop policy if exists "notification channel settings select own or admin"
on public.notification_channel_settings;
drop policy if exists "notification channel settings insert own"
on public.notification_channel_settings;
drop policy if exists "notification channel settings update own"
on public.notification_channel_settings;
drop policy if exists "notification channel settings delete own"
on public.notification_channel_settings;

create policy "notification channel settings select own or admin"
on public.notification_channel_settings
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "notification channel settings insert own"
on public.notification_channel_settings
for insert
to authenticated
with check (user_id = auth.uid());

create policy "notification channel settings update own"
on public.notification_channel_settings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notification channel settings delete own"
on public.notification_channel_settings
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "notification phone numbers select own or admin"
on public.notification_phone_numbers;
drop policy if exists "notification phone numbers insert own"
on public.notification_phone_numbers;
drop policy if exists "notification phone numbers update own"
on public.notification_phone_numbers;
drop policy if exists "notification phone numbers delete own"
on public.notification_phone_numbers;

create policy "notification phone numbers select own or admin"
on public.notification_phone_numbers
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "notification phone numbers insert own"
on public.notification_phone_numbers
for insert
to authenticated
with check (user_id = auth.uid());

create policy "notification phone numbers update own"
on public.notification_phone_numbers
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "notification phone numbers delete own"
on public.notification_phone_numbers
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete
on public.notification_channel_settings
to authenticated;

grant select, insert, update, delete
on public.notification_phone_numbers
to authenticated;
