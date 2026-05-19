-- BYTECH CRM Profile Workspace Backend Foundation
-- Purpose:
--   Add per-user preferences and prepare private profile avatar storage.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'light',
  language text not null default 'en',
  timezone text not null default 'UTC',
  compact_mode boolean not null default false,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check
    check (theme in ('light', 'dark', 'system')),
  constraint user_preferences_language_not_blank
    check (length(trim(language)) between 2 and 20),
  constraint user_preferences_timezone_not_blank
    check (length(trim(timezone)) between 1 and 80)
);

comment on table public.user_preferences is
  'Per-user UI and notification preferences for BYTECH CRM profile workspace.';
comment on column public.user_preferences.user_id is
  'Primary key and owner profile. One preferences row per profile.';

create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_user_preferences_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "user preferences select own or admin" on public.user_preferences;
drop policy if exists "user preferences insert own or admin" on public.user_preferences;
drop policy if exists "user preferences update own or admin" on public.user_preferences;
drop policy if exists "user preferences delete admin" on public.user_preferences;

create policy "user preferences select own or admin"
on public.user_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "user preferences insert own or admin"
on public.user_preferences
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "user preferences update own or admin"
on public.user_preferences
for update
to authenticated
using (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
)
with check (
  user_id = auth.uid()
  or public.crm_storage_is_admin()
);

create policy "user preferences delete admin"
on public.user_preferences
for delete
to authenticated
using (public.crm_storage_is_admin());

grant select, insert, update, delete on public.user_preferences to authenticated;

-- Private profile avatar storage support.
-- The application stores avatars under:
--   crm-private/profiles/{auth.uid()}/avatar/{generated-file-name}
-- Users may read, insert, and delete their own avatar objects. Admins may read
-- avatar objects for profile-management views. This keeps profile photos out of
-- public buckets while providing a safe future UI integration point.

create or replace function public.crm_storage_is_profile_avatar_path(
  p_object_name text
)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select split_part(p_object_name, '/', 1) = 'profiles'
    and split_part(p_object_name, '/', 2) <> ''
    and split_part(p_object_name, '/', 3) = 'avatar'
    and split_part(p_object_name, '/', 4) <> ''
    and split_part(p_object_name, '/', 5) = '';
$$;

create or replace function public.crm_storage_can_access_profile_avatar(
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.crm_storage_is_profile_avatar_path(p_object_name)
    and auth.uid() is not null
    and (
      split_part(p_object_name, '/', 2) = auth.uid()::text
      or public.crm_storage_is_admin()
    );
$$;

create or replace function public.crm_storage_can_read_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (
    p_bucket_id = 'crm-private'
    and public.crm_storage_can_access_profile_avatar(p_object_name)
  )
  or exists (
    select 1
    from public.file_attachments fa
    where fa.bucket_name = p_bucket_id
      and fa.file_path = p_object_name
      and public.crm_storage_has_module(
        public.crm_storage_module_for_attachment(fa.related_table)
      )
  );
$$;

create or replace function public.crm_storage_can_delete_object(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select (
    p_bucket_id = 'crm-private'
    and public.crm_storage_can_access_profile_avatar(p_object_name)
  )
  or (
    public.crm_storage_is_admin()
    and exists (
      select 1
      from public.file_attachments fa
      where fa.bucket_name = p_bucket_id
        and fa.file_path = p_object_name
    )
  );
$$;

create or replace function public.crm_storage_can_insert_bucket_path(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and case
      when p_bucket_id = 'crm-private'
        and public.crm_storage_is_profile_avatar_path(p_object_name)
      then split_part(p_object_name, '/', 2) = auth.uid()::text
      when p_bucket_id in ('attachments', 'crm-private') then
        case split_part(p_object_name, '/', 1)
          when 'field-jobs' then public.crm_storage_has_module('field_jobs')
          when 'projects' then public.crm_storage_has_module('projects')
          when 'support' then public.crm_storage_has_module('support')
          else false
        end
      when p_bucket_id = 'payment-proofs' then
        split_part(p_object_name, '/', 1) = 'receipts'
        and public.crm_storage_has_module('payments')
      when p_bucket_id = 'branding' then
        split_part(p_object_name, '/', 1) = 'company-logo'
        and public.crm_storage_is_admin()
      when p_bucket_id in ('site', 'crm-public') then
        public.crm_storage_is_admin()
      else false
    end;
$$;

grant execute on function public.crm_storage_is_profile_avatar_path(text)
  to authenticated, anon;
grant execute on function public.crm_storage_can_access_profile_avatar(text)
  to authenticated;
grant execute on function public.crm_storage_can_read_object(text, text)
  to authenticated;
grant execute on function public.crm_storage_can_delete_object(text, text)
  to authenticated;
grant execute on function public.crm_storage_can_insert_bucket_path(text, text)
  to authenticated;
