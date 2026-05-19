-- BYTECH CRM Team Management Settings Backend Foundation
-- Purpose:
--   Add real CRM-owned backend support for the Team Management settings screen.
--   These settings are configuration records only; this migration does not
--   make unfinished workflows like SSO, directory sync, or approval engines
--   active across the app.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   Existing users, roles, teams, and allowed_modules behavior remain unchanged.

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
    'unusual_signin_detected',
    'document_branding_settings_updated',
    'role_created',
    'role_updated',
    'role_deactivated',
    'role_permission_updated',
    'permission_set_created',
    'permission_set_updated',
    'team_created',
    'team_updated',
    'team_member_updated',
    'invitation_created',
    'invitation_updated',
    'team_management_settings_updated'
  ));

create table if not exists public.team_management_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  default_role_id uuid null references public.crm_roles(id) on delete set null,
  auto_assign_department_mode text not null default 'manual',
  invite_approval_enabled boolean not null default true,
  team_timezone text not null default 'Africa/Lagos',
  allow_managers_invite_members boolean not null default true,
  allow_team_leads_create_projects boolean not null default true,
  restrict_data_access_by_department boolean not null default false,
  role_inheritance_enabled boolean not null default true,
  send_welcome_email boolean not null default false,
  require_profile_completion boolean not null default true,
  onboarding_checklist_enabled boolean not null default true,
  default_onboarding_department text null,
  approval_workflow text not null default 'project_invoice_approvals',
  default_approval_chain text not null default 'manager_department_head_admin',
  escalation_hours integer not null default 48,
  auto_approve_admins boolean not null default true,
  new_member_invite_alerts boolean not null default true,
  role_change_alerts boolean not null default true,
  department_assignment_alerts boolean not null default true,
  member_deactivation_alerts boolean not null default false,
  default_member_view text not null default 'card',
  items_per_page integer not null default 20,
  date_format text not null default 'DD MMM YYYY',
  show_online_status boolean not null default true,
  salary_visibility text not null default 'admins_only',
  department_visibility text not null default 'all_managers',
  hide_inactive_members boolean not null default false,
  data_export_permission text not null default 'admins_and_managers',
  directory_sync_status text not null default 'not_configured',
  sso_status text not null default 'not_configured',
  webhooks_status text not null default 'not_configured',
  api_access_status text not null default 'not_configured',
  created_by uuid null references public.profiles(id) on delete set null,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_management_settings_singleton_check
    check (id = '00000000-0000-0000-0000-000000000001'::uuid),
  constraint team_management_auto_assign_mode_check
    check (auto_assign_department_mode in ('manual', 'profile_department', 'email_domain')),
  constraint team_management_default_onboarding_department_check
    check (
      default_onboarding_department is null
      or default_onboarding_department in (
        'sales',
        'operations',
        'support',
        'engineering',
        'inventory',
        'finance',
        'hr'
      )
    ),
  constraint team_management_approval_workflow_check
    check (approval_workflow in ('disabled', 'project_invoice_approvals', 'all_financial_approvals', 'custom')),
  constraint team_management_approval_chain_check
    check (default_approval_chain in ('manager', 'department_head_admin', 'manager_department_head_admin', 'admin_only')),
  constraint team_management_escalation_hours_check
    check (escalation_hours between 1 and 720),
  constraint team_management_default_member_view_check
    check (default_member_view in ('card', 'table', 'compact')),
  constraint team_management_items_per_page_check
    check (items_per_page in (10, 20, 25, 50, 100)),
  constraint team_management_date_format_check
    check (date_format in ('DD MMM YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  constraint team_management_salary_visibility_check
    check (salary_visibility in ('admins_only', 'admins_and_hr', 'admins_and_managers', 'hidden')),
  constraint team_management_department_visibility_check
    check (department_visibility in ('all_managers', 'same_department', 'admins_only')),
  constraint team_management_data_export_permission_check
    check (data_export_permission in ('admins_only', 'admins_and_managers', 'disabled')),
  constraint team_management_directory_sync_status_check
    check (directory_sync_status in ('not_configured', 'configured', 'disabled')),
  constraint team_management_sso_status_check
    check (sso_status in ('not_configured', 'configured', 'disabled')),
  constraint team_management_webhooks_status_check
    check (webhooks_status in ('not_configured', 'configured', 'disabled')),
  constraint team_management_api_access_status_check
    check (api_access_status in ('not_configured', 'configured', 'disabled'))
);

comment on table public.team_management_settings is
  'Singleton organization-level team management settings for the Settings workspace. Workflow toggles are configuration only until app workflows explicitly consume them.';

comment on column public.team_management_settings.default_role_id is
  'Default CRM role assigned to new members when invitation or onboarding flows support it.';
comment on column public.team_management_settings.auto_assign_department_mode is
  'Configuration for future department assignment behavior. Existing user creation remains unchanged until explicitly integrated.';
comment on column public.team_management_settings.directory_sync_status is
  'Directory sync configuration status only. No external directory connection is implemented by this setting.';
comment on column public.team_management_settings.sso_status is
  'SSO configuration status only. Supabase Auth remains the active authentication system.';
comment on column public.team_management_settings.webhooks_status is
  'Webhook configuration status only. No webhook delivery is implemented by this setting.';
comment on column public.team_management_settings.api_access_status is
  'API access configuration status only. No API key management is implemented by this setting.';

create index if not exists idx_team_management_settings_default_role_id
on public.team_management_settings(default_role_id);

drop trigger if exists trg_team_management_settings_updated_at
on public.team_management_settings;

create trigger trg_team_management_settings_updated_at
before update on public.team_management_settings
for each row
execute function public.set_user_management_updated_at();

alter table public.team_management_settings enable row level security;

drop policy if exists "team management settings select admin"
on public.team_management_settings;
create policy "team management settings select admin"
on public.team_management_settings
for select
to authenticated
using (public.crm_user_is_admin());

drop policy if exists "team management settings insert admin"
on public.team_management_settings;
create policy "team management settings insert admin"
on public.team_management_settings
for insert
to authenticated
with check (public.crm_user_is_admin());

drop policy if exists "team management settings update admin"
on public.team_management_settings;
create policy "team management settings update admin"
on public.team_management_settings
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

grant select, insert, update on public.team_management_settings
to authenticated;

insert into public.team_management_settings (id, default_role_id)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  (select id from public.crm_roles where slug = 'member' limit 1)
)
on conflict (id) do nothing;
