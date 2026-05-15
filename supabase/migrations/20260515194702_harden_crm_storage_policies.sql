-- BYTECH CRM Stabilization Phase 5
-- Purpose:
--   Harden Supabase Storage RLS for CRM-owned buckets without touching Nexus or AI.
--
-- Scope:
--   This migration only changes storage.objects policies and small public helper
--   functions used by those policies. It does not touch nexus or ai schemas.
--
-- Compatibility notes:
--   Current CRM uploads write the storage object before inserting the
--   public.file_attachments row. For that reason INSERT policies cannot require
--   an existing file_attachments row yet. INSERT is restricted by bucket, path
--   prefix, authenticated user, active profile, and module/admin access.
--   SELECT and DELETE can safely require a registered file_attachments row.

create or replace function public.crm_storage_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role = 'admin'
  );
$$;

create or replace function public.crm_storage_has_module(p_module_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and (
        p.role = 'admin'
        or p_module_name = any(coalesce(p.allowed_modules, array[]::text[]))
      )
  );
$$;

create or replace function public.crm_storage_module_for_attachment(p_related_table text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_related_table
    when 'field_jobs' then 'field_jobs'
    when 'projects' then 'projects'
    when 'receipts' then 'payments'
    when 'support_tickets' then 'support'
    else null
  end;
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
  select exists (
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
  select public.crm_storage_is_admin()
    and exists (
      select 1
      from public.file_attachments fa
      where fa.bucket_name = p_bucket_id
        and fa.file_path = p_object_name
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

grant execute on function public.crm_storage_is_admin() to authenticated;
grant execute on function public.crm_storage_has_module(text) to authenticated;
grant execute on function public.crm_storage_module_for_attachment(text) to authenticated, anon;
grant execute on function public.crm_storage_can_read_object(text, text) to authenticated;
grant execute on function public.crm_storage_can_delete_object(text, text) to authenticated;
grant execute on function public.crm_storage_can_insert_bucket_path(text, text) to authenticated;

-- Remove broad legacy policies for CRM buckets. Policy names vary between
-- environments, so this only removes policies whose definition or name mentions
-- the CRM buckets being hardened.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        policyname ilike any (array[
          '%attachment%',
          '%payment-proof%',
          '%payment_proof%',
          '%branding%',
          '%site%',
          '%crm-private%',
          '%crm_private%',
          '%crm-public%',
          '%crm_public%'
        ])
        or coalesce(qual, '') ilike any (array[
          '%attachments%',
          '%payment-proofs%',
          '%branding%',
          '%site%',
          '%crm-private%',
          '%crm-public%'
        ])
        or coalesce(with_check, '') ilike any (array[
          '%attachments%',
          '%payment-proofs%',
          '%branding%',
          '%site%',
          '%crm-private%',
          '%crm-public%'
        ])
      )
  loop
    execute format('drop policy if exists %I on storage.objects', v_policy.policyname);
  end loop;
end;
$$;

drop policy if exists "bytech crm private object read" on storage.objects;
drop policy if exists "bytech crm private object insert" on storage.objects;
drop policy if exists "bytech crm private object delete" on storage.objects;
drop policy if exists "bytech crm branding public read" on storage.objects;
drop policy if exists "bytech crm branding admin insert" on storage.objects;
drop policy if exists "bytech crm branding admin update" on storage.objects;
drop policy if exists "bytech crm branding admin delete" on storage.objects;
drop policy if exists "bytech crm public bucket read" on storage.objects;
drop policy if exists "bytech crm public bucket admin insert" on storage.objects;
drop policy if exists "bytech crm public bucket admin update" on storage.objects;
drop policy if exists "bytech crm public bucket admin delete" on storage.objects;
drop policy if exists "bytech crm site public read" on storage.objects;
drop policy if exists "bytech crm site admin insert" on storage.objects;
drop policy if exists "bytech crm site admin update" on storage.objects;
drop policy if exists "bytech crm site admin delete" on storage.objects;

-- Private CRM documents:
-- attachments: projects/*, support/*, field-jobs/*
-- payment-proofs: receipts/*
-- crm-private: reserved for future private CRM documents with the same prefix model.
create policy "bytech crm private object read"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('attachments', 'payment-proofs', 'crm-private')
  and public.crm_storage_can_read_object(bucket_id, name)
);

create policy "bytech crm private object insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('attachments', 'payment-proofs', 'crm-private')
  and public.crm_storage_can_insert_bucket_path(bucket_id, name)
);

create policy "bytech crm private object delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('attachments', 'payment-proofs', 'crm-private')
  and public.crm_storage_can_delete_object(bucket_id, name)
);

-- Branding is intentionally public-read for the company logo, but mutations are
-- admin-only and limited to the company-logo folder used by the CRM app.
create policy "bytech crm branding public read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'branding'
  and split_part(name, '/', 1) = 'company-logo'
);

create policy "bytech crm branding admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'branding'
  and public.crm_storage_can_insert_bucket_path(bucket_id, name)
);

create policy "bytech crm branding admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'branding'
  and split_part(name, '/', 1) = 'company-logo'
  and public.crm_storage_is_admin()
)
with check (
  bucket_id = 'branding'
  and split_part(name, '/', 1) = 'company-logo'
  and public.crm_storage_is_admin()
);

create policy "bytech crm branding admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'branding'
  and split_part(name, '/', 1) = 'company-logo'
  and public.crm_storage_is_admin()
);

-- crm-public is reserved for intentional public CRM assets. Reads are public;
-- mutations are admin-only until app-level workflows are added.
create policy "bytech crm public bucket read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'crm-public');

create policy "bytech crm public bucket admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'crm-public'
  and public.crm_storage_can_insert_bucket_path(bucket_id, name)
);

create policy "bytech crm public bucket admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'crm-public'
  and public.crm_storage_is_admin()
)
with check (
  bucket_id = 'crm-public'
  and public.crm_storage_is_admin()
);

create policy "bytech crm public bucket admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'crm-public'
  and public.crm_storage_is_admin()
);

-- The site bucket is not used by current CRM upload actions. Keep public reads
-- for existing site assets, but remove broad authenticated mutation access.
create policy "bytech crm site public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site');

create policy "bytech crm site admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site'
  and public.crm_storage_can_insert_bucket_path(bucket_id, name)
);

create policy "bytech crm site admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site'
  and public.crm_storage_is_admin()
)
with check (
  bucket_id = 'site'
  and public.crm_storage_is_admin()
);

create policy "bytech crm site admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site'
  and public.crm_storage_is_admin()
);
