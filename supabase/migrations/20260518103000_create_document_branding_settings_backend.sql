-- BYTECH CRM Documents & Branding Backend Foundation
-- Purpose:
--   Add real CRM-owned backend support for Settings > Documents & Branding.
--   This supports the five document settings tabs:
--   Company Branding, Invoice Settings, Quotation Settings, Receipt Settings,
--   and Footer & Terms.
--
-- Scope:
--   BYTECH CRM owns the public schema. This migration does not touch nexus or ai.
--   Existing public.company_settings remains the canonical source for company
--   name, logo, email, phone, website, and address. This table stores document
--   display behavior and branding preferences only.
--
-- Notes:
--   BYTECH CRM is currently a single-organization CRM. This singleton table can
--   be expanded to organization_id when multi-tenant ownership is introduced.

create table if not exists public.document_branding_settings (
  id text primary key default 'default',

  -- Company Branding tab
  tagline text null,
  primary_brand_color text not null default '#6B46C1',
  secondary_brand_color text null default '#E9D5FF',
  show_logo_on_documents boolean not null default true,

  -- Invoice Settings tab
  invoice_number_prefix text not null default 'INV-',
  invoice_title text not null default 'INVOICE',
  invoice_default_due_days integer not null default 30,
  invoice_date_format text not null default 'MM/DD/YYYY',
  invoice_show_title boolean not null default true,
  invoice_show_invoice_date boolean not null default true,
  invoice_show_due_date boolean not null default true,
  invoice_show_company_logo boolean not null default true,
  invoice_show_company_address boolean not null default true,
  invoice_show_company_email_phone boolean not null default true,
  invoice_show_customer_address boolean not null default true,
  invoice_show_item_descriptions boolean not null default true,
  invoice_show_item_quantity boolean not null default true,
  invoice_show_item_unit_price boolean not null default true,
  invoice_show_line_total boolean not null default true,
  invoice_show_subtotal boolean not null default true,
  invoice_show_tax boolean not null default true,
  invoice_show_discounts boolean not null default true,
  invoice_show_grand_total boolean not null default true,
  invoice_paid_label text not null default 'PAID',
  invoice_unpaid_label text not null default 'UNPAID',
  invoice_overdue_label text not null default 'OVERDUE',

  -- Quotation Settings tab
  quotation_number_prefix text not null default 'QTN-',
  quotation_title text not null default 'QUOTATION',
  quotation_default_validity_days integer not null default 30,
  quotation_date_format text not null default 'MM/DD/YYYY',
  quotation_show_title boolean not null default true,
  quotation_show_quotation_date boolean not null default true,
  quotation_show_expiry_date boolean not null default true,
  quotation_show_company_logo boolean not null default true,
  quotation_show_company_address boolean not null default true,
  quotation_show_company_email_phone boolean not null default true,
  quotation_show_customer_address boolean not null default true,
  quotation_show_item_descriptions boolean not null default true,
  quotation_show_item_quantity boolean not null default true,
  quotation_show_item_unit_price boolean not null default true,
  quotation_show_line_total boolean not null default true,
  quotation_show_subtotal boolean not null default true,
  quotation_show_tax boolean not null default true,
  quotation_show_discounts boolean not null default true,
  quotation_show_grand_total boolean not null default true,
  quotation_draft_label text not null default 'DRAFT',
  quotation_sent_label text not null default 'SENT',
  quotation_accepted_label text not null default 'ACCEPTED',
  quotation_expired_label text not null default 'EXPIRED',

  -- Receipt Settings tab
  receipt_number_prefix text not null default 'RCPT-',
  receipt_title text not null default 'RECEIPT',
  receipt_default_validity_days integer not null default 30,
  receipt_date_format text not null default 'MM/DD/YYYY',
  receipt_show_title boolean not null default true,
  receipt_show_receipt_date boolean not null default true,
  receipt_show_payment_date boolean not null default true,
  receipt_show_company_logo boolean not null default true,
  receipt_show_company_address boolean not null default true,
  receipt_show_company_email_phone boolean not null default true,
  receipt_show_customer_address boolean not null default true,
  receipt_show_payment_method boolean not null default true,
  receipt_show_item_descriptions boolean not null default true,
  receipt_show_item_quantity boolean not null default true,
  receipt_show_item_unit_price boolean not null default true,
  receipt_show_subtotal boolean not null default true,
  receipt_show_tax boolean not null default true,
  receipt_show_discounts boolean not null default true,
  receipt_show_grand_total boolean not null default true,
  receipt_paid_label text not null default 'PAID',
  receipt_partial_label text not null default 'PARTIAL',
  receipt_refunded_label text not null default 'REFUNDED',
  receipt_cancelled_label text not null default 'CANCELLED',

  -- Footer & Terms tab
  default_footer_text text null default 'Thank you for your business!',
  invoice_footer_text text null,
  quotation_footer_text text null,
  receipt_footer_text text null,
  terms_conditions text null,
  payment_instructions text null,
  show_footer_on_documents boolean not null default true,
  show_terms_conditions boolean not null default true,
  show_signature_block boolean not null default true,
  show_page_numbers boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint document_branding_settings_singleton_check
    check (id = 'default'),
  constraint document_branding_settings_primary_color_check
    check (primary_brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint document_branding_settings_secondary_color_check
    check (
      secondary_brand_color is null
      or secondary_brand_color ~ '^#[0-9A-Fa-f]{6}$'
    ),
  constraint document_branding_settings_date_format_check
    check (
      invoice_date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')
      and quotation_date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')
      and receipt_date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')
    ),
  constraint document_branding_settings_day_ranges_check
    check (
      invoice_default_due_days between 0 and 3650
      and quotation_default_validity_days between 0 and 3650
      and receipt_default_validity_days between 0 and 3650
    ),
  constraint document_branding_settings_prefixes_not_blank_check
    check (
      length(trim(invoice_number_prefix)) between 1 and 20
      and length(trim(quotation_number_prefix)) between 1 and 20
      and length(trim(receipt_number_prefix)) between 1 and 20
    ),
  constraint document_branding_settings_titles_not_blank_check
    check (
      length(trim(invoice_title)) between 1 and 80
      and length(trim(quotation_title)) between 1 and 80
      and length(trim(receipt_title)) between 1 and 80
    ),
  constraint document_branding_settings_labels_not_blank_check
    check (
      length(trim(invoice_paid_label)) between 1 and 40
      and length(trim(invoice_unpaid_label)) between 1 and 40
      and length(trim(invoice_overdue_label)) between 1 and 40
      and length(trim(quotation_draft_label)) between 1 and 40
      and length(trim(quotation_sent_label)) between 1 and 40
      and length(trim(quotation_accepted_label)) between 1 and 40
      and length(trim(quotation_expired_label)) between 1 and 40
      and length(trim(receipt_paid_label)) between 1 and 40
      and length(trim(receipt_partial_label)) between 1 and 40
      and length(trim(receipt_refunded_label)) between 1 and 40
      and length(trim(receipt_cancelled_label)) between 1 and 40
    )
);

comment on table public.document_branding_settings is
  'Singleton document branding/settings record for CRM print documents.';
comment on column public.document_branding_settings.invoice_number_prefix is
  'Preferred invoice number prefix for future invoice numbering integration.';
comment on column public.document_branding_settings.quotation_number_prefix is
  'Preferred quotation number prefix for future quotation numbering integration.';
comment on column public.document_branding_settings.receipt_number_prefix is
  'Preferred receipt number prefix for future receipt numbering integration.';
comment on column public.document_branding_settings.payment_instructions is
  'Payment instructions shown on documents when enabled. Do not store secrets.';

insert into public.document_branding_settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists trg_document_branding_settings_updated_at
on public.document_branding_settings;

create trigger trg_document_branding_settings_updated_at
before update on public.document_branding_settings
for each row
execute function public.set_settings_admin_updated_at();

alter table public.document_branding_settings enable row level security;

drop policy if exists "document branding settings select authenticated"
on public.document_branding_settings;
drop policy if exists "document branding settings insert admin"
on public.document_branding_settings;
drop policy if exists "document branding settings update admin"
on public.document_branding_settings;
drop policy if exists "document branding settings delete admin"
on public.document_branding_settings;

create policy "document branding settings select authenticated"
on public.document_branding_settings
for select
to authenticated
using (auth.uid() is not null);

create policy "document branding settings insert admin"
on public.document_branding_settings
for insert
to authenticated
with check (public.crm_storage_is_admin());

create policy "document branding settings update admin"
on public.document_branding_settings
for update
to authenticated
using (public.crm_storage_is_admin())
with check (public.crm_storage_is_admin());

create policy "document branding settings delete admin"
on public.document_branding_settings
for delete
to authenticated
using (public.crm_storage_is_admin());

grant select, insert, update, delete
on public.document_branding_settings
to authenticated;

-- Extend security event taxonomy so document branding changes are auditable.
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
    'document_branding_settings_updated'
  ));
