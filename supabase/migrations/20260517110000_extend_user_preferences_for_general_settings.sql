-- BYTECH CRM Settings - General Page Backend Foundation
-- Purpose:
--   Extend per-user preferences to support the General Settings workspace.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   Organization fields continue to use public.company_settings.

alter table public.user_preferences
  add column if not exists default_landing_page text not null default 'dashboard',
  add column if not exists items_per_page integer not null default 25,
  add column if not exists time_format text not null default '12-hour',
  add column if not exists date_format text not null default 'MM/DD/YYYY',
  add column if not exists inline_editing_enabled boolean not null default true,
  add column if not exists start_of_week text not null default 'monday',
  add column if not exists default_view_mode text not null default 'comfortable',
  add column if not exists view_density text not null default 'comfortable',
  add column if not exists highlight_color text not null default '#4F46E5',
  add column if not exists show_avatars boolean not null default true,
  add column if not exists show_tooltips boolean not null default true,
  add column if not exists auto_save_changes boolean not null default true,
  add column if not exists show_productivity_tips boolean not null default true,
  add column if not exists confirm_before_deleting boolean not null default true,
  add column if not exists keyboard_shortcuts_enabled boolean not null default true;

alter table public.user_preferences
  drop constraint if exists user_preferences_default_landing_page_check,
  drop constraint if exists user_preferences_items_per_page_check,
  drop constraint if exists user_preferences_time_format_check,
  drop constraint if exists user_preferences_date_format_check,
  drop constraint if exists user_preferences_start_of_week_check,
  drop constraint if exists user_preferences_default_view_mode_check,
  drop constraint if exists user_preferences_view_density_check,
  drop constraint if exists user_preferences_highlight_color_check;

alter table public.user_preferences
  add constraint user_preferences_default_landing_page_check
    check (
      default_landing_page in (
        'dashboard',
        'leads',
        'customers',
        'projects',
        'field-jobs',
        'support',
        'inventory',
        'payments',
        'reports'
      )
    ),
  add constraint user_preferences_items_per_page_check
    check (items_per_page in (10, 25, 50, 100)),
  add constraint user_preferences_time_format_check
    check (time_format in ('12-hour', '24-hour')),
  add constraint user_preferences_date_format_check
    check (date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  add constraint user_preferences_start_of_week_check
    check (
      start_of_week in (
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
      )
    ),
  add constraint user_preferences_default_view_mode_check
    check (default_view_mode in ('comfortable', 'compact')),
  add constraint user_preferences_view_density_check
    check (view_density in ('comfortable', 'compact', 'condensed')),
  add constraint user_preferences_highlight_color_check
    check (highlight_color ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.user_preferences.default_landing_page is
  'Per-user default landing page after login.';
comment on column public.user_preferences.items_per_page is
  'Per-user default record count for tables and lists.';
comment on column public.user_preferences.time_format is
  'Per-user time display preference: 12-hour or 24-hour.';
comment on column public.user_preferences.date_format is
  'Per-user date display format.';
comment on column public.user_preferences.inline_editing_enabled is
  'Per-user preference for inline editing affordances.';
comment on column public.user_preferences.start_of_week is
  'Per-user week start preference for calendars and reports.';
comment on column public.user_preferences.default_view_mode is
  'Per-user default workspace view mode.';
comment on column public.user_preferences.view_density is
  'Per-user default list/table density.';
comment on column public.user_preferences.highlight_color is
  'Per-user primary accent color for workspace highlights.';
comment on column public.user_preferences.show_avatars is
  'Per-user preference for avatar visibility in lists and tables.';
comment on column public.user_preferences.show_tooltips is
  'Per-user preference for helper tooltip visibility.';
comment on column public.user_preferences.auto_save_changes is
  'Per-user preference for automatic saving where supported by UI.';
comment on column public.user_preferences.show_productivity_tips is
  'Per-user preference for contextual productivity tips.';
comment on column public.user_preferences.confirm_before_deleting is
  'Per-user preference requiring confirmation before destructive actions.';
comment on column public.user_preferences.keyboard_shortcuts_enabled is
  'Per-user preference for keyboard shortcut behavior.';

-- Extend security event taxonomy so settings updates are auditable.
alter table public.user_security_events
  drop constraint if exists user_security_events_event_type_check;

alter table public.user_security_events
  add constraint user_security_events_event_type_check
    check (
      event_type in (
        'login',
        'logout',
        'password_reset',
        'password_changed',
        'profile_updated',
        'avatar_updated',
        'preferences_updated',
        'notification_preferences_updated',
        'general_settings_updated',
        'company_settings_updated'
      )
    );
