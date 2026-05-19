-- BYTECH CRM Users/Teams/Roles Backend Foundation Phase 1
-- Purpose:
--   Add real CRM-owned backend support for the future Users & Teams workspace:
--   role hierarchy, role permissions, reusable permission sets, teams,
--   team membership, and user invitations.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   This migration preserves the existing profiles.role + profiles.allowed_modules
--   permission model and does not change login, route protection, or app
--   authorization behavior yet.

create or replace function public.crm_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.crm_storage_is_admin();
$$;

grant execute on function public.crm_user_is_admin() to authenticated;

create or replace function public.set_user_management_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
    'invitation_updated'
  ));

create table if not exists public.crm_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  role_type text not null default 'custom',
  role_level integer not null default 50,
  parent_role_id uuid null references public.crm_roles(id) on delete set null,
  icon text not null default 'shield',
  color text not null default '#4F46E5',
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_roles_slug_unique unique (slug),
  constraint crm_roles_name_not_blank check (length(trim(name)) > 0),
  constraint crm_roles_slug_not_blank check (length(trim(slug)) > 0),
  constraint crm_roles_type_check check (role_type in ('system', 'custom')),
  constraint crm_roles_level_check check (role_level between 0 and 1000),
  constraint crm_roles_color_check check (color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.crm_roles is
  'Enterprise role hierarchy metadata. Existing profiles.role remains the active compatibility model until a later rollout.';

create index if not exists idx_crm_roles_parent_role_id
on public.crm_roles(parent_role_id);

create index if not exists idx_crm_roles_role_type
on public.crm_roles(role_type);

create table if not exists public.profile_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.crm_roles(id) on delete restrict,
  is_primary boolean not null default true,
  assigned_by uuid null references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint profile_roles_unique_profile_role unique (profile_id, role_id)
);

comment on table public.profile_roles is
  'Bridge table between existing profiles and future enterprise roles. This does not replace profiles.role yet.';

create unique index if not exists idx_profile_roles_one_primary
on public.profile_roles(profile_id)
where is_primary;

create index if not exists idx_profile_roles_role_id
on public.profile_roles(role_id);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  department text null,
  icon text not null default 'users',
  color text not null default '#4F46E5',
  team_lead_id uuid null references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_slug_unique unique (slug),
  constraint teams_name_not_blank check (length(trim(name)) > 0),
  constraint teams_slug_not_blank check (length(trim(slug)) > 0),
  constraint teams_department_check check (
    department is null
    or department in (
      'sales',
      'operations',
      'support',
      'engineering',
      'inventory',
      'finance',
      'hr'
    )
  ),
  constraint teams_color_check check (color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.teams is
  'CRM team records used by the future Team Management workspace.';

create index if not exists idx_teams_department
on public.teams(department);

create index if not exists idx_teams_team_lead_id
on public.teams(team_lead_id);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  team_role text not null default 'member',
  added_by uuid null references public.profiles(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint team_members_unique_team_profile unique (team_id, profile_id),
  constraint team_members_role_check check (team_role in ('lead', 'member'))
);

comment on table public.team_members is
  'Membership records connecting profiles to CRM teams.';

create index if not exists idx_team_members_profile_id
on public.team_members(profile_id);

create index if not exists idx_team_members_team_id
on public.team_members(team_id);

create table if not exists public.crm_permission_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  icon text not null default 'shield',
  color text not null default '#4F46E5',
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_permission_sets_slug_unique unique (slug),
  constraint crm_permission_sets_name_not_blank check (length(trim(name)) > 0),
  constraint crm_permission_sets_slug_not_blank check (length(trim(slug)) > 0),
  constraint crm_permission_sets_color_check check (color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.crm_permission_sets is
  'Reusable permission groups for future assignment to roles or teams.';

create table if not exists public.crm_permission_set_rules (
  id uuid primary key default gen_random_uuid(),
  permission_set_id uuid not null references public.crm_permission_sets(id) on delete cascade,
  module_name text not null,
  access_level text not null default 'no_access',
  can_read boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  can_export boolean not null default false,
  can_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_permission_set_rules_unique_module unique (permission_set_id, module_name),
  constraint crm_permission_set_rules_module_not_blank check (length(trim(module_name)) > 0),
  constraint crm_permission_set_rules_access_check check (
    access_level in ('full_access', 'edit', 'view_only', 'no_access', 'not_applicable')
  )
);

comment on table public.crm_permission_set_rules is
  'Module/action permissions for each reusable permission set.';

create index if not exists idx_crm_permission_set_rules_module
on public.crm_permission_set_rules(module_name);

create table if not exists public.crm_role_permission_sets (
  role_id uuid not null references public.crm_roles(id) on delete cascade,
  permission_set_id uuid not null references public.crm_permission_sets(id) on delete cascade,
  assigned_by uuid null references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (role_id, permission_set_id)
);

comment on table public.crm_role_permission_sets is
  'Assignments of reusable permission sets to enterprise roles.';

create table if not exists public.crm_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.crm_roles(id) on delete cascade,
  module_name text not null,
  access_level text not null default 'no_access',
  can_read boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  can_export boolean not null default false,
  can_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_role_permissions_unique_module unique (role_id, module_name),
  constraint crm_role_permissions_module_not_blank check (length(trim(module_name)) > 0),
  constraint crm_role_permissions_access_check check (
    access_level in ('full_access', 'edit', 'view_only', 'no_access', 'not_applicable')
  )
);

comment on table public.crm_role_permissions is
  'Direct role-to-module action matrix for future requirePermission integration.';

create index if not exists idx_crm_role_permissions_module
on public.crm_role_permissions(module_name);

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  department text null,
  job_title text null,
  role_id uuid null references public.crm_roles(id) on delete set null,
  team_id uuid null references public.teams(id) on delete set null,
  invite_token_hash text null,
  delivery_method text not null default 'email',
  status text not null default 'pending',
  invited_by uuid null references public.profiles(id) on delete set null,
  accepted_by uuid null references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_invitations_email_not_blank check (length(trim(email)) > 0),
  constraint user_invitations_full_name_not_blank check (length(trim(full_name)) > 0),
  constraint user_invitations_department_check check (
    department is null
    or department in (
      'sales',
      'operations',
      'support',
      'engineering',
      'inventory',
      'finance',
      'hr'
    )
  ),
  constraint user_invitations_delivery_method_check check (delivery_method in ('email', 'link')),
  constraint user_invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

comment on table public.user_invitations is
  'Pending and historical user invitations. Raw invite tokens must never be stored; only hashes are stored here.';

create unique index if not exists idx_user_invitations_pending_email
on public.user_invitations(lower(email))
where status = 'pending';

create unique index if not exists idx_user_invitations_token_hash
on public.user_invitations(invite_token_hash)
where invite_token_hash is not null;

create index if not exists idx_user_invitations_status
on public.user_invitations(status, expires_at);

create index if not exists idx_user_invitations_role_team
on public.user_invitations(role_id, team_id);

drop trigger if exists trg_crm_roles_updated_at on public.crm_roles;
create trigger trg_crm_roles_updated_at
before update on public.crm_roles
for each row execute function public.set_user_management_updated_at();

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
before update on public.teams
for each row execute function public.set_user_management_updated_at();

drop trigger if exists trg_crm_permission_sets_updated_at on public.crm_permission_sets;
create trigger trg_crm_permission_sets_updated_at
before update on public.crm_permission_sets
for each row execute function public.set_user_management_updated_at();

drop trigger if exists trg_crm_permission_set_rules_updated_at on public.crm_permission_set_rules;
create trigger trg_crm_permission_set_rules_updated_at
before update on public.crm_permission_set_rules
for each row execute function public.set_user_management_updated_at();

drop trigger if exists trg_crm_role_permissions_updated_at on public.crm_role_permissions;
create trigger trg_crm_role_permissions_updated_at
before update on public.crm_role_permissions
for each row execute function public.set_user_management_updated_at();

drop trigger if exists trg_user_invitations_updated_at on public.user_invitations;
create trigger trg_user_invitations_updated_at
before update on public.user_invitations
for each row execute function public.set_user_management_updated_at();

alter table public.crm_roles enable row level security;
alter table public.profile_roles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.crm_permission_sets enable row level security;
alter table public.crm_permission_set_rules enable row level security;
alter table public.crm_role_permission_sets enable row level security;
alter table public.crm_role_permissions enable row level security;
alter table public.user_invitations enable row level security;

drop policy if exists "crm roles select authenticated" on public.crm_roles;
drop policy if exists "crm roles insert admin" on public.crm_roles;
drop policy if exists "crm roles update admin" on public.crm_roles;
drop policy if exists "crm roles delete custom admin" on public.crm_roles;

create policy "crm roles select authenticated"
on public.crm_roles
for select
to authenticated
using (true);

create policy "crm roles insert admin"
on public.crm_roles
for insert
to authenticated
with check (public.crm_user_is_admin());

create policy "crm roles update admin"
on public.crm_roles
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

create policy "crm roles delete custom admin"
on public.crm_roles
for delete
to authenticated
using (public.crm_user_is_admin() and is_system = false);

drop policy if exists "profile roles select own or admin" on public.profile_roles;
drop policy if exists "profile roles insert admin" on public.profile_roles;
drop policy if exists "profile roles update admin" on public.profile_roles;
drop policy if exists "profile roles delete admin" on public.profile_roles;

create policy "profile roles select own or admin"
on public.profile_roles
for select
to authenticated
using (profile_id = auth.uid() or public.crm_user_is_admin());

create policy "profile roles insert admin"
on public.profile_roles
for insert
to authenticated
with check (public.crm_user_is_admin());

create policy "profile roles update admin"
on public.profile_roles
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

create policy "profile roles delete admin"
on public.profile_roles
for delete
to authenticated
using (public.crm_user_is_admin());

drop policy if exists "teams select member or admin" on public.teams;
drop policy if exists "teams insert admin" on public.teams;
drop policy if exists "teams update admin" on public.teams;
drop policy if exists "teams delete admin" on public.teams;

create policy "teams select member or admin"
on public.teams
for select
to authenticated
using (
  public.crm_user_is_admin()
  or exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id
      and tm.profile_id = auth.uid()
  )
);

create policy "teams insert admin"
on public.teams
for insert
to authenticated
with check (public.crm_user_is_admin());

create policy "teams update admin"
on public.teams
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

create policy "teams delete admin"
on public.teams
for delete
to authenticated
using (public.crm_user_is_admin());

drop policy if exists "team members select own or admin" on public.team_members;
drop policy if exists "team members insert admin" on public.team_members;
drop policy if exists "team members update admin" on public.team_members;
drop policy if exists "team members delete admin" on public.team_members;

create policy "team members select own or admin"
on public.team_members
for select
to authenticated
using (profile_id = auth.uid() or public.crm_user_is_admin());

create policy "team members insert admin"
on public.team_members
for insert
to authenticated
with check (public.crm_user_is_admin());

create policy "team members update admin"
on public.team_members
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

create policy "team members delete admin"
on public.team_members
for delete
to authenticated
using (public.crm_user_is_admin());

drop policy if exists "permission sets select admin" on public.crm_permission_sets;
drop policy if exists "permission sets insert admin" on public.crm_permission_sets;
drop policy if exists "permission sets update admin" on public.crm_permission_sets;
drop policy if exists "permission sets delete custom admin" on public.crm_permission_sets;

create policy "permission sets select admin"
on public.crm_permission_sets
for select
to authenticated
using (public.crm_user_is_admin());

create policy "permission sets insert admin"
on public.crm_permission_sets
for insert
to authenticated
with check (public.crm_user_is_admin());

create policy "permission sets update admin"
on public.crm_permission_sets
for update
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

create policy "permission sets delete custom admin"
on public.crm_permission_sets
for delete
to authenticated
using (public.crm_user_is_admin() and is_system = false);

drop policy if exists "permission set rules admin" on public.crm_permission_set_rules;
create policy "permission set rules admin"
on public.crm_permission_set_rules
for all
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

drop policy if exists "role permission sets admin" on public.crm_role_permission_sets;
create policy "role permission sets admin"
on public.crm_role_permission_sets
for all
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

drop policy if exists "role permissions admin" on public.crm_role_permissions;
create policy "role permissions admin"
on public.crm_role_permissions
for all
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

drop policy if exists "user invitations admin" on public.user_invitations;
create policy "user invitations admin"
on public.user_invitations
for all
to authenticated
using (public.crm_user_is_admin())
with check (public.crm_user_is_admin());

grant select, insert, update, delete on public.crm_roles to authenticated;
grant select, insert, update, delete on public.profile_roles to authenticated;
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.team_members to authenticated;
grant select, insert, update, delete on public.crm_permission_sets to authenticated;
grant select, insert, update, delete on public.crm_permission_set_rules to authenticated;
grant select, insert, update, delete on public.crm_role_permission_sets to authenticated;
grant select, insert, update, delete on public.crm_role_permissions to authenticated;
grant select, insert, update, delete on public.user_invitations to authenticated;

insert into public.crm_roles (
  name,
  slug,
  description,
  role_type,
  role_level,
  parent_role_id,
  icon,
  color,
  is_system,
  is_active
)
values
  (
    'Administrator',
    'administrator',
    'Full access to all modules, settings, and administration.',
    'system',
    100,
    null,
    'shield',
    '#4F46E5',
    true,
    true
  ),
  (
    'Manager',
    'manager',
    'Manage teams, projects, and view operational reports.',
    'system',
    80,
    (select id from public.crm_roles where slug = 'administrator'),
    'users',
    '#3B82F6',
    true,
    true
  ),
  (
    'Team Lead',
    'team-lead',
    'Oversee team activities and coordinate assigned work.',
    'system',
    60,
    (select id from public.crm_roles where slug = 'manager'),
    'shield-check',
    '#10B981',
    true,
    true
  ),
  (
    'Member',
    'member',
    'View and update assigned work based on module access.',
    'system',
    40,
    (select id from public.crm_roles where slug = 'manager'),
    'user',
    '#F59E0B',
    true,
    true
  ),
  (
    'Viewer',
    'viewer',
    'View-only access for approved modules and reports.',
    'system',
    20,
    (select id from public.crm_roles where slug = 'manager'),
    'eye',
    '#EF4444',
    true,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  role_type = excluded.role_type,
  role_level = excluded.role_level,
  icon = excluded.icon,
  color = excluded.color,
  is_system = excluded.is_system,
  is_active = excluded.is_active;

update public.crm_roles child
set parent_role_id = parent.id
from public.crm_roles parent
where child.slug = 'manager'
  and parent.slug = 'administrator'
  and child.is_system = true;

update public.crm_roles child
set parent_role_id = parent.id
from public.crm_roles parent
where child.slug in ('team-lead', 'member', 'viewer')
  and parent.slug = 'manager'
  and child.is_system = true;

insert into public.teams (name, slug, description, department, icon, color, is_active)
values
  ('Sales', 'sales', 'Sales, leads, quotations, and customer acquisition.', 'sales', 'trending-up', '#10B981', true),
  ('Operations', 'operations', 'Operations, delivery, and field coordination.', 'operations', 'briefcase', '#4F46E5', true),
  ('Support', 'support', 'Support tickets, repairs, and customer care.', 'support', 'headphones', '#06B6D4', true),
  ('Engineering', 'engineering', 'Engineering, deployments, and technical delivery.', 'engineering', 'wrench', '#3B82F6', true),
  ('Inventory', 'inventory', 'Inventory, assets, suppliers, and restocking.', 'inventory', 'boxes', '#F59E0B', true),
  ('Finance', 'finance', 'Invoices, payments, expenses, and financial operations.', 'finance', 'badge-dollar-sign', '#22C55E', true),
  ('HR', 'hr', 'People operations and employee administration.', 'hr', 'users', '#EC4899', true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  department = excluded.department,
  icon = excluded.icon,
  color = excluded.color,
  is_active = excluded.is_active;

insert into public.crm_permission_sets (
  name,
  slug,
  description,
  icon,
  color,
  is_system,
  is_active
)
values
  (
    'Administrator Full Access',
    'administrator-full-access',
    'System permission set with full access across every CRM module.',
    'shield',
    '#4F46E5',
    true,
    true
  ),
  (
    'Standard Staff Baseline',
    'standard-staff-baseline',
    'Conservative baseline permission set for staff roles. Existing allowed_modules remains authoritative until later rollout.',
    'user',
    '#10B981',
    true,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  is_system = excluded.is_system,
  is_active = excluded.is_active;

with modules(module_name) as (
  select unnest(array[
    'dashboard',
    'leads',
    'customers',
    'quotations',
    'invoices',
    'payments',
    'tasks',
    'projects',
    'reports',
    'support',
    'notifications',
    'deployments',
    'assets',
    'field_jobs',
    'engineer_daily',
    'inventory',
    'suppliers',
    'supplier_payables',
    'restocking',
    'expenses',
    'audit_logs',
    'users',
    'settings',
    'search',
    'messages'
  ]::text[])
),
role_rows as (
  select id, slug
  from public.crm_roles
  where slug in ('administrator', 'manager', 'team-lead', 'member', 'viewer')
)
insert into public.crm_role_permissions (
  role_id,
  module_name,
  access_level,
  can_read,
  can_create,
  can_update,
  can_delete,
  can_approve,
  can_export,
  can_admin
)
select
  role_rows.id,
  modules.module_name,
  case
    when role_rows.slug = 'administrator' then 'full_access'
    when role_rows.slug = 'viewer' then 'view_only'
    when role_rows.slug in ('manager', 'team-lead')
      and modules.module_name in ('settings', 'users', 'audit_logs')
      then 'no_access'
    when role_rows.slug in ('manager', 'team-lead') then 'edit'
    when role_rows.slug = 'member' then 'view_only'
    else 'no_access'
  end,
  case
    when role_rows.slug = 'administrator' then true
    when role_rows.slug = 'viewer' then true
    when role_rows.slug in ('manager', 'team-lead') and modules.module_name not in ('settings', 'users', 'audit_logs') then true
    when role_rows.slug = 'member' then true
    else false
  end,
  case
    when role_rows.slug = 'administrator' then true
    when role_rows.slug in ('manager', 'team-lead') and modules.module_name not in ('settings', 'users', 'audit_logs') then true
    else false
  end,
  case
    when role_rows.slug = 'administrator' then true
    when role_rows.slug in ('manager', 'team-lead') and modules.module_name not in ('settings', 'users', 'audit_logs') then true
    else false
  end,
  role_rows.slug = 'administrator',
  role_rows.slug = 'administrator',
  role_rows.slug = 'administrator',
  role_rows.slug = 'administrator'
from role_rows
cross join modules
on conflict (role_id, module_name) do nothing;

with modules(module_name) as (
  select unnest(array[
    'dashboard',
    'leads',
    'customers',
    'quotations',
    'invoices',
    'payments',
    'tasks',
    'projects',
    'reports',
    'support',
    'notifications',
    'deployments',
    'assets',
    'field_jobs',
    'engineer_daily',
    'inventory',
    'suppliers',
    'supplier_payables',
    'restocking',
    'expenses',
    'audit_logs',
    'users',
    'settings',
    'search',
    'messages'
  ]::text[])
),
permission_sets as (
  select id, slug
  from public.crm_permission_sets
  where slug in ('administrator-full-access', 'standard-staff-baseline')
)
insert into public.crm_permission_set_rules (
  permission_set_id,
  module_name,
  access_level,
  can_read,
  can_create,
  can_update,
  can_delete,
  can_approve,
  can_export,
  can_admin
)
select
  permission_sets.id,
  modules.module_name,
  case
    when permission_sets.slug = 'administrator-full-access' then 'full_access'
    else 'view_only'
  end,
  true,
  permission_sets.slug = 'administrator-full-access',
  permission_sets.slug = 'administrator-full-access',
  permission_sets.slug = 'administrator-full-access',
  permission_sets.slug = 'administrator-full-access',
  permission_sets.slug = 'administrator-full-access',
  permission_sets.slug = 'administrator-full-access'
from permission_sets
cross join modules
on conflict (permission_set_id, module_name) do nothing;

insert into public.crm_role_permission_sets (role_id, permission_set_id)
select r.id, ps.id
from public.crm_roles r
cross join public.crm_permission_sets ps
where r.slug = 'administrator'
  and ps.slug = 'administrator-full-access'
on conflict (role_id, permission_set_id) do nothing;

insert into public.profile_roles (profile_id, role_id, is_primary)
select p.id, r.id, true
from public.profiles p
join public.crm_roles r
  on r.slug = case when p.role = 'admin' then 'administrator' else 'member' end
on conflict (profile_id, role_id) do nothing;

insert into public.team_members (team_id, profile_id, team_role)
select t.id, p.id, 'member'
from public.profiles p
join public.teams t
  on t.department = p.department
where p.department is not null
on conflict (team_id, profile_id) do nothing;
