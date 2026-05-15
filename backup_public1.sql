


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."project_payment_status" AS ENUM (
    'unpaid',
    'part_payment',
    'paid_in_full'
);


ALTER TYPE "public"."project_payment_status" OWNER TO "postgres";


CREATE TYPE "public"."project_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."project_priority" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'proposal',
    'approved',
    'paid',
    'planning',
    'in_progress',
    'review',
    'completed',
    'maintenance',
    'on_hold',
    'cancelled'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."project_task_status" AS ENUM (
    'todo',
    'in_progress',
    'review',
    'completed',
    'blocked',
    'cancelled'
);


ALTER TYPE "public"."project_task_status" OWNER TO "postgres";


CREATE TYPE "public"."project_type" AS ENUM (
    'website_development',
    'pos_deployment',
    'crm_setup',
    'digital_marketing',
    'networking_infrastructure',
    'maintenance',
    'custom_software',
    'other'
);


ALTER TYPE "public"."project_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_inventory_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.movement_type = 'stock_in' then
    update public.inventory_items
    set current_quantity = current_quantity + new.quantity
    where id = new.inventory_item_id;
  elsif new.movement_type = 'stock_out' then
    update public.inventory_items
    set current_quantity = greatest(0, current_quantity - new.quantity)
    where id = new.inventory_item_id;
  elsif new.movement_type = 'adjustment' then
    update public.inventory_items
    set current_quantity = new.quantity
    where id = new.inventory_item_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."apply_inventory_movement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_customer_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.customer_code is null or new.customer_code = '' then
    new.customer_code := public.generate_customer_code();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."assign_customer_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := public.generate_invoice_number();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."assign_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_quote_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.quote_number is null or new.quote_number = '' then
    new.quote_number := public.generate_quote_number();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."assign_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_receipt_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.receipt_number is null or new.receipt_number = '' then
    new.receipt_number := public.generate_receipt_number();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."assign_receipt_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."convert_lead_to_customer"("p_lead_id" "uuid", "p_plan_type" "text", "p_setup_fee" numeric, "p_subscription_amount" numeric, "p_billing_cycle" "text" DEFAULT 'monthly'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_lead public.leads%rowtype;
  v_customer_id uuid;
begin
  select *
  into v_lead
  from public.leads
  where id = p_lead_id;

  if not found then
    raise exception 'Lead not found';
  end if;

  if v_lead.converted_customer_id is not null then
    return v_lead.converted_customer_id;
  end if;

  insert into public.customers (
    company_name,
    contact_person,
    phone,
    email,
    address,
    city,
    state,
    industry,
    business_type,
    plan_type,
    subscription_amount,
    billing_cycle,
    setup_fee,
    account_manager_id,
    lead_id,
    status,
    created_by
  )
  values (
    v_lead.company_name,
    v_lead.contact_person,
    v_lead.phone,
    v_lead.email,
    v_lead.address,
    v_lead.city,
    v_lead.state,
    v_lead.industry,
    v_lead.business_type,
    p_plan_type,
    coalesce(p_subscription_amount, 0),
    coalesce(p_billing_cycle, 'monthly'),
    coalesce(p_setup_fee, 0),
    v_lead.assigned_to,
    v_lead.id,
    'active',
    auth.uid()
  )
  returning id into v_customer_id;

  update public.leads
  set
    converted_customer_id = v_customer_id,
    converted_at = now(),
    status = 'closed_won',
    updated_at = now()
  where id = p_lead_id;

  insert into public.lead_activities (
    lead_id,
    activity_type,
    new_value,
    actor_id
  )
  values (
    p_lead_id,
    'converted',
    jsonb_build_object('customer_id', v_customer_id),
    auth.uid()
  );

  insert into public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  )
  values (
    auth.uid(),
    'customer',
    v_customer_id,
    'created',
    'Lead converted to customer'
  );

  return v_customer_id;
end;
$$;


ALTER FUNCTION "public"."convert_lead_to_customer"("p_lead_id" "uuid", "p_plan_type" "text", "p_setup_fee" numeric, "p_subscription_amount" numeric, "p_billing_cycle" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_receipt_after_payment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.receipts (
    invoice_id,
    customer_id,
    payment_transaction_id,
    amount_received,
    payment_method,
    payment_date,
    received_by,
    notes
  )
  values (
    new.invoice_id,
    new.customer_id,
    new.id,
    new.amount,
    new.payment_method,
    new.paid_at,
    new.received_by,
    new.notes
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."create_receipt_after_payment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_customer_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  next_number integer;
begin
  select coalesce(count(*), 0) + 1 into next_number
  from public.customers;

  return 'CUS-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;


ALTER FUNCTION "public"."generate_customer_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  next_number integer;
begin
  select coalesce(count(*), 0) + 1 into next_number
  from public.payment_invoices;

  return 'INV-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_project_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  next_number integer;
begin
  if new.project_code is null or new.project_code = '' then
    select coalesce(count(*), 0) + 1
    into next_number
    from projects
    where extract(year from created_at) = extract(year from now());

    new.project_code := 'BYT-PRJ-' || extract(year from now())::int || '-' || lpad(next_number::text, 3, '0');
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."generate_project_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_quote_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  next_number integer;
begin
  select coalesce(count(*), 0) + 1 into next_number
  from public.quotations;

  return 'QUO-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;


ALTER FUNCTION "public"."generate_quote_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_receipt_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  next_number integer;
begin
  select coalesce(count(*), 0) + 1 into next_number
  from public.receipts;

  return 'RCT-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;


ALTER FUNCTION "public"."generate_receipt_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_system_reminders"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_created_count integer := 0;
  v_invoice record;
  v_task record;
  v_lead record;
begin
  -- 1. Overdue invoices
  for v_invoice in
    select
      pi.id,
      pi.invoice_number,
      pi.customer_id,
      c.account_manager_id
    from public.payment_invoices pi
    left join public.customers c on c.id = pi.customer_id
    where pi.status = 'overdue'
  loop
    if v_invoice.account_manager_id is not null then
      insert into public.notifications (
        user_id,
        type,
        title,
        message,
        related_table,
        related_id,
        is_read
      )
      select
        v_invoice.account_manager_id,
        'payment',
        'Overdue invoice',
        'Invoice ' || v_invoice.invoice_number || ' is overdue.',
        'payment_invoices',
        v_invoice.id,
        false
      where not exists (
        select 1
        from public.notifications n
        where n.user_id = v_invoice.account_manager_id
          and n.related_table = 'payment_invoices'
          and n.related_id = v_invoice.id
          and n.title = 'Overdue invoice'
          and n.created_at::date = current_date
      );

      if found then
        v_created_count := v_created_count + 1;
      end if;
    end if;
  end loop;

  -- 2. Due soon invoices
  for v_invoice in
    select
      pi.id,
      pi.invoice_number,
      pi.customer_id,
      pi.due_date,
      c.account_manager_id
    from public.payment_invoices pi
    left join public.customers c on c.id = pi.customer_id
    where pi.status in ('pending', 'partial')
      and pi.due_date between current_date and current_date + interval '1 day'
  loop
    if v_invoice.account_manager_id is not null then
      insert into public.notifications (
        user_id,
        type,
        title,
        message,
        related_table,
        related_id,
        is_read
      )
      select
        v_invoice.account_manager_id,
        'payment',
        'Invoice due soon',
        'Invoice ' || v_invoice.invoice_number || ' is due on ' || v_invoice.due_date::text || '.',
        'payment_invoices',
        v_invoice.id,
        false
      where not exists (
        select 1
        from public.notifications n
        where n.user_id = v_invoice.account_manager_id
          and n.related_table = 'payment_invoices'
          and n.related_id = v_invoice.id
          and n.title = 'Invoice due soon'
          and n.created_at::date = current_date
      );

      if found then
        v_created_count := v_created_count + 1;
      end if;
    end if;
  end loop;

  -- 3. Lead follow-up due today + overdue
  for v_lead in
    select
      l.id,
      l.company_name,
      l.assigned_to,
      l.next_follow_up_at::date as follow_up_day
    from public.leads l
    where l.status not in ('closed_won', 'closed_lost')
      and l.next_follow_up_at is not null
      and l.next_follow_up_at::date <= current_date
  loop
    if v_lead.assigned_to is not null then
      if v_lead.follow_up_day = current_date then
        insert into public.notifications (
          user_id,
          type,
          title,
          message,
          related_table,
          related_id,
          is_read
        )
        select
          v_lead.assigned_to,
          'lead',
          'Lead follow-up due today',
          'Follow-up is due today for ' || v_lead.company_name || '.',
          'leads',
          v_lead.id,
          false
        where not exists (
          select 1
          from public.notifications n
          where n.user_id = v_lead.assigned_to
            and n.related_table = 'leads'
            and n.related_id = v_lead.id
            and n.title = 'Lead follow-up due today'
            and n.created_at::date = current_date
        );

        if found then
          v_created_count := v_created_count + 1;
        end if;
      elsif v_lead.follow_up_day < current_date then
        insert into public.notifications (
          user_id,
          type,
          title,
          message,
          related_table,
          related_id,
          is_read
        )
        select
          v_lead.assigned_to,
          'lead',
          'Lead follow-up overdue',
          'Follow-up is overdue for ' || v_lead.company_name || '.',
          'leads',
          v_lead.id,
          false
        where not exists (
          select 1
          from public.notifications n
          where n.user_id = v_lead.assigned_to
            and n.related_table = 'leads'
            and n.related_id = v_lead.id
            and n.title = 'Lead follow-up overdue'
            and n.created_at::date = current_date
        );

        if found then
          v_created_count := v_created_count + 1;
        end if;
      end if;
    end if;
  end loop;

  -- 4. Tasks due today + overdue
  for v_task in
    select
      t.id,
      t.title,
      t.assigned_to,
      t.due_date::date as due_day
    from public.tasks t
    where t.status not in ('completed', 'cancelled')
      and t.due_date is not null
      and t.due_date::date <= current_date
  loop
    if v_task.assigned_to is not null then
      if v_task.due_day = current_date then
        insert into public.notifications (
          user_id,
          type,
          title,
          message,
          related_table,
          related_id,
          is_read
        )
        select
          v_task.assigned_to,
          'task',
          'Task due today',
          'Task "' || v_task.title || '" is due today.',
          'tasks',
          v_task.id,
          false
        where not exists (
          select 1
          from public.notifications n
          where n.user_id = v_task.assigned_to
            and n.related_table = 'tasks'
            and n.related_id = v_task.id
            and n.title = 'Task due today'
            and n.created_at::date = current_date
        );

        if found then
          v_created_count := v_created_count + 1;
        end if;
      elsif v_task.due_day < current_date then
        insert into public.notifications (
          user_id,
          type,
          title,
          message,
          related_table,
          related_id,
          is_read
        )
        select
          v_task.assigned_to,
          'task',
          'Task overdue',
          'Task "' || v_task.title || '" is overdue.',
          'tasks',
          v_task.id,
          false
        where not exists (
          select 1
          from public.notifications n
          where n.user_id = v_task.assigned_to
            and n.related_table = 'tasks'
            and n.related_id = v_task.id
            and n.title = 'Task overdue'
            and n.created_at::date = current_date
        );

        if found then
          v_created_count := v_created_count + 1;
        end if;
      end if;
    end if;
  end loop;

  return json_build_object(
    'success', true,
    'created_count', v_created_count
  );
end;
$$;


ALTER FUNCTION "public"."generate_system_reminders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    'New User',
    'staff'
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner', 'admin', 'manager')
  );
$$;


ALTER FUNCTION "public"."is_org_admin"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
  );
$$;


ALTER FUNCTION "public"."is_org_member"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text" DEFAULT NULL::"text", "p_actor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("usage_id" "uuid", "movement_id" "uuid", "field_job_id" "uuid", "inventory_item_id" "uuid", "quantity" numeric, "unit_cost" numeric, "total_cost" numeric, "previous_quantity" numeric, "new_quantity" numeric, "created_by" "uuid", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_field_job public.field_jobs%rowtype;
  v_item public.inventory_items%rowtype;
  v_usage public.field_job_inventory_usage%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_actor_id uuid;
  v_previous_quantity numeric;
  v_expected_quantity numeric;
  v_actual_quantity numeric;
  v_unit_cost numeric;
  v_total_cost numeric;
  v_note text;
begin
  if p_field_job_id is null then
    raise exception 'Field job is required'
      using errcode = '22023';
  end if;

  if p_inventory_item_id is null then
    raise exception 'Inventory item is required'
      using errcode = '22023';
  end if;

  v_actor_id := coalesce(p_actor_id, auth.uid());

  if v_actor_id is null then
    raise exception 'Authenticated actor is required'
      using errcode = '28000';
  end if;

  if p_actor_id is not null and p_actor_id <> auth.uid() then
    raise exception 'Actor id must match authenticated user'
      using errcode = '42501';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero'
      using errcode = '22023';
  end if;

  -- Lock the field job first. Keep this lock order consistent in future RPCs
  -- to reduce deadlock risk: field_jobs before inventory_items.
  select *
  into v_field_job
  from public.field_jobs
  where id = p_field_job_id
  for update;

  if not found then
    raise exception 'Field job not found'
      using errcode = 'P0002';
  end if;

  -- Lock the inventory item second so concurrent stock issues serialize.
  select *
  into v_item
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found'
      using errcode = 'P0002';
  end if;

  v_previous_quantity := coalesce(v_item.current_quantity, 0);
  v_expected_quantity := v_previous_quantity - p_quantity;
  v_unit_cost := coalesce(v_item.unit_cost, 0);
  v_total_cost := p_quantity * v_unit_cost;
  v_note := coalesce(nullif(trim(coalesce(p_notes, '')), ''), 'Issued to field job');

  -- The inventory trigger uses greatest(0, current_quantity - new.quantity)
  -- for stock_out, so the RPC must reject insufficient stock before insert.
  if v_expected_quantity < 0 then
    raise exception 'Insufficient stock. Available: %, requested: %',
      v_previous_quantity,
      p_quantity
      using errcode = '23514';
  end if;

  insert into public.field_job_inventory_usage (
    field_job_id,
    inventory_item_id,
    quantity,
    unit_cost,
    notes,
    created_by
  )
  values (
    p_field_job_id,
    p_inventory_item_id,
    p_quantity,
    v_unit_cost,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_actor_id
  )
  returning *
  into v_usage;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity,
    unit_cost,
    field_job_id,
    note,
    created_by
  )
  values (
    p_inventory_item_id,
    'stock_out',
    p_quantity,
    v_unit_cost,
    p_field_job_id,
    v_note,
    v_actor_id
  )
  returning *
  into v_movement;

  select current_quantity
  into v_actual_quantity
  from public.inventory_items
  where id = p_inventory_item_id;

  if v_actual_quantity is distinct from v_expected_quantity then
    raise exception 'Field job inventory issue balance verification failed. Expected quantity %, actual quantity %.',
      v_expected_quantity,
      v_actual_quantity
      using errcode = '23514';
  end if;

  insert into public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  )
  values (
    v_actor_id,
    'field_job',
    p_field_job_id,
    'inventory_issued',
    format(
      'Issued %s of inventory item %s to field job %s. Quantity changed from %s to %s.',
      p_quantity,
      p_inventory_item_id,
      p_field_job_id,
      v_previous_quantity,
      v_expected_quantity
    )
  );

  return query
  select
    v_usage.id,
    v_movement.id,
    v_usage.field_job_id,
    v_usage.inventory_item_id,
    v_usage.quantity::numeric,
    v_usage.unit_cost::numeric,
    coalesce(v_usage.total_cost, v_total_cost)::numeric,
    v_previous_quantity,
    v_expected_quantity,
    v_usage.created_by,
    v_usage.created_at;
end;
$$;


ALTER FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text", "p_actor_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text", "p_actor_id" "uuid") IS 'Atomically issues inventory to a field job by inserting field_job_inventory_usage, inserting one stock_out inventory_movements row, and verifying trg_apply_inventory_movement applied the expected stock change.';



CREATE OR REPLACE FUNCTION "public"."mark_overdue_invoices"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.payment_invoices
  set
    status = 'overdue',
    updated_at = now()
  where due_date < current_date
    and status in ('pending', 'partial');
$$;


ALTER FUNCTION "public"."mark_overdue_invoices"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric DEFAULT NULL::numeric, "p_field_job_id" "uuid" DEFAULT NULL::"uuid", "p_note" "text" DEFAULT NULL::"text", "p_actor_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("movement_id" "uuid", "inventory_item_id" "uuid", "movement_type" "text", "quantity" numeric, "unit_cost" numeric, "field_job_id" "uuid", "note" "text", "previous_quantity" numeric, "new_quantity" numeric, "created_by" "uuid", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_item public.inventory_items%rowtype;
  v_previous_quantity numeric;
  v_expected_quantity numeric;
  v_actual_quantity numeric;
  v_movement public.inventory_movements%rowtype;
  v_actor_id uuid;
begin
  if p_inventory_item_id is null then
    raise exception 'Inventory item is required'
      using errcode = '22023';
  end if;

  v_actor_id := coalesce(p_actor_id, auth.uid());

  if v_actor_id is null then
    raise exception 'Authenticated actor is required'
      using errcode = '28000';
  end if;

  if p_actor_id is not null and p_actor_id <> auth.uid() then
    raise exception 'Actor id must match authenticated user'
      using errcode = '42501';
  end if;

  if p_movement_type not in ('stock_in', 'stock_out', 'adjustment') then
    raise exception 'Invalid movement type: %', p_movement_type
      using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero'
      using errcode = '22023';
  end if;

  if p_unit_cost is not null and p_unit_cost < 0 then
    raise exception 'Unit cost cannot be negative'
      using errcode = '22023';
  end if;

  select *
  into v_item
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found'
      using errcode = 'P0002';
  end if;

  v_previous_quantity := coalesce(v_item.current_quantity, 0);

  if p_movement_type in ('stock_in', 'adjustment') then
    v_expected_quantity := v_previous_quantity + p_quantity;
  elsif p_movement_type = 'stock_out' then
    v_expected_quantity := v_previous_quantity - p_quantity;
  end if;

  if v_expected_quantity < 0 then
    raise exception 'Insufficient stock. Available: %, requested: %',
      v_previous_quantity,
      p_quantity
      using errcode = '23514';
  end if;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity,
    unit_cost,
    field_job_id,
    note,
    created_by
  )
  values (
    p_inventory_item_id,
    p_movement_type,
    p_quantity,
    p_unit_cost,
    p_field_job_id,
    nullif(trim(coalesce(p_note, '')), ''),
    v_actor_id
  )
  returning *
  into v_movement;

  select current_quantity
  into v_actual_quantity
  from public.inventory_items
  where id = p_inventory_item_id;

  if v_actual_quantity is distinct from v_expected_quantity then
    raise exception 'Inventory movement balance verification failed. Expected quantity %, actual quantity %.',
      v_expected_quantity,
      v_actual_quantity
      using errcode = '23514';
  end if;

  insert into public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  )
  values (
    v_actor_id,
    'inventory_item',
    p_inventory_item_id,
    'movement_created',
    format(
      'Posted %s movement of %s. Quantity changed from %s to %s.',
      p_movement_type,
      p_quantity,
      v_previous_quantity,
      v_expected_quantity
    )
  );

  return query
  select
    v_movement.id,
    v_movement.inventory_item_id,
    v_movement.movement_type::text,
    v_movement.quantity::numeric,
    v_movement.unit_cost::numeric,
    v_movement.field_job_id,
    v_movement.note,
    v_previous_quantity,
    v_expected_quantity,
    v_movement.created_by,
    v_movement.created_at;
end;
$$;


ALTER FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric, "p_field_job_id" "uuid", "p_note" "text", "p_actor_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric, "p_field_job_id" "uuid", "p_note" "text", "p_actor_id" "uuid") IS 'Posts an inventory stock movement atomically by locking inventory_items, validating expected stock, inserting inventory_movements, and verifying the existing movement insert behavior applied the expected balance change.';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_invoice_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  total_paid numeric(12,2);
  invoice_amount numeric(12,2);
begin
  select coalesce(sum(amount), 0)
  into total_paid
  from public.payment_transactions
  where invoice_id = new.invoice_id;

  select amount
  into invoice_amount
  from public.payment_invoices
  where id = new.invoice_id;

  update public.payment_invoices
  set
    amount_paid = total_paid,
    status = case
      when total_paid <= 0 then 'pending'
      when total_paid < invoice_amount then 'partial'
      when total_paid >= invoice_amount then 'paid'
      else status
    end,
    paid_date = case
      when total_paid >= invoice_amount then current_date
      else paid_date
    end,
    updated_at = now()
  where id = new.invoice_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."sync_invoice_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_assets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_assets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_settings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_company_settings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_field_jobs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_field_jobs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_items_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_inventory_items_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pos_deployments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_pos_deployments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_support_ticket_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_support_ticket_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "description" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activity_logs_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['lead'::"text", 'customer'::"text", 'task'::"text", 'support_ticket'::"text", 'quotation'::"text", 'invoice'::"text", 'payment'::"text", 'payment_transaction'::"text", 'asset'::"text", 'user'::"text", 'supplier'::"text", 'field_job'::"text", 'inventory_item'::"text", 'report'::"text", 'expense'::"text", 'project'::"text", 'project_task'::"text"])))
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asset_repair_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_id" "uuid" NOT NULL,
    "support_ticket_id" "uuid",
    "repair_title" "text" NOT NULL,
    "repair_type" "text" NOT NULL,
    "repair_status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "technician_id" "uuid",
    "cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "repair_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "asset_repair_history_cost_check" CHECK (("cost" >= (0)::numeric)),
    CONSTRAINT "asset_repair_history_repair_status_check" CHECK (("repair_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "asset_repair_history_repair_type_check" CHECK (("repair_type" = ANY (ARRAY['inspection'::"text", 'repair'::"text", 'replacement'::"text", 'maintenance'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."asset_repair_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asset_tag" "text" DEFAULT ('AST-'::"text" || "upper"("substr"(("gen_random_uuid"())::"text", 1, 8))) NOT NULL,
    "serial_number" "text",
    "customer_id" "uuid",
    "branch_id" "uuid",
    "deployment_id" "uuid",
    "device_type" "text" NOT NULL,
    "condition" "text" DEFAULT 'new'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "purchase_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assets_condition_check" CHECK (("condition" = ANY (ARRAY['new'::"text", 'good'::"text", 'faulty'::"text", 'under_repair'::"text", 'retired'::"text"]))),
    CONSTRAINT "assets_device_type_check" CHECK (("device_type" = ANY (ARRAY['pos_terminal'::"text", 'printer'::"text", 'scanner'::"text", 'router'::"text", 'other'::"text"]))),
    CONSTRAINT "assets_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'lost'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "access_level" "text" DEFAULT 'viewer'::"text" NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."client_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "brand_name" "text",
    "email" "text",
    "phone" "text",
    "website" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "country" "text",
    "logo_url" "text",
    "currency_symbol" "text" DEFAULT '₦'::"text" NOT NULL,
    "document_footer" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_branches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "branch_name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_branches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_code" "text",
    "company_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "alternate_phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "industry" "text",
    "business_type" "text",
    "plan_type" "text" NOT NULL,
    "subscription_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "billing_cycle" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "setup_fee" numeric(12,2) DEFAULT 0 NOT NULL,
    "onboarding_date" "date",
    "go_live_date" "date",
    "account_manager_id" "uuid",
    "lead_id" "uuid",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "customers_billing_cycle_check" CHECK (("billing_cycle" = ANY (ARRAY['monthly'::"text", 'quarterly'::"text", 'yearly'::"text", 'one_time'::"text"]))),
    CONSTRAINT "customers_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['cloud'::"text", 'offline'::"text"]))),
    CONSTRAINT "customers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "report_date" "date" NOT NULL,
    "summary" "text" NOT NULL,
    "tasks_completed_count" integer DEFAULT 0 NOT NULL,
    "leads_contacted_count" integer DEFAULT 0 NOT NULL,
    "customers_supported_count" integer DEFAULT 0 NOT NULL,
    "blockers" "text",
    "next_day_plan" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "category" "text" NOT NULL,
    "expense_date" "date" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "expenses_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "expenses_category_check" CHECK (("category" = ANY (ARRAY['operations'::"text", 'salaries'::"text", 'transport'::"text", 'marketing'::"text", 'utilities'::"text", 'repair_materials'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_job_inventory_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "field_job_id" "uuid" NOT NULL,
    "inventory_item_id" "uuid" NOT NULL,
    "quantity" numeric(12,2) NOT NULL,
    "unit_cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_cost" numeric(12,2) GENERATED ALWAYS AS (("quantity" * "unit_cost")) STORED,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "field_job_inventory_usage_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "field_job_inventory_usage_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric))
);


ALTER TABLE "public"."field_job_inventory_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_job_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "field_job_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "quantity" numeric(12,2) DEFAULT 1 NOT NULL,
    "unit" "text",
    "unit_cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_cost" numeric(12,2) GENERATED ALWAYS AS (("quantity" * "unit_cost")) STORED,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "field_job_materials_quantity_check" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "field_job_materials_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric))
);


ALTER TABLE "public"."field_job_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_job_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "field_job_id" "uuid" NOT NULL,
    "photo_type" "text" NOT NULL,
    "file_attachment_id" "uuid",
    "caption" "text",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "field_job_photos_photo_type_check" CHECK (("photo_type" = ANY (ARRAY['before'::"text", 'after'::"text", 'inspection'::"text", 'materials'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."field_job_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_job_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "field_job_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "status" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "field_job_updates_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'in_progress'::"text", 'awaiting_parts'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."field_job_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_number" "text" DEFAULT ('JOB-'::"text" || "upper"("substr"(("gen_random_uuid"())::"text", 1, 8))) NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "asset_id" "uuid",
    "support_ticket_id" "uuid",
    "title" "text" NOT NULL,
    "job_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "assigned_engineer_id" "uuid",
    "scheduled_date" "date",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "reported_issue" "text",
    "work_done" "text",
    "materials_used" "text",
    "recommendation" "text",
    "customer_feedback" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checked_in_at" timestamp with time zone,
    "work_started_at" timestamp with time zone,
    "work_completed_at" timestamp with time zone,
    "checked_out_at" timestamp with time zone,
    CONSTRAINT "field_jobs_job_type_check" CHECK (("job_type" = ANY (ARRAY['wiring_repair'::"text", 'hardware_repair'::"text", 'site_inspection'::"text", 'site_survey'::"text", 'site_assessment'::"text", 'installation'::"text", 'maintenance_visit'::"text", 'device_replacement'::"text", 'network_troubleshooting'::"text", 'training_visit'::"text", 'other'::"text"]))),
    CONSTRAINT "field_jobs_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "field_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'in_progress'::"text", 'awaiting_parts'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."field_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "related_table" "text" NOT NULL,
    "related_id" "uuid" NOT NULL,
    "bucket_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "file_size" bigint,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."file_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_code" "text" DEFAULT ('INV-'::"text" || "upper"("substr"(("gen_random_uuid"())::"text", 1, 8))) NOT NULL,
    "item_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "sku" "text",
    "unit" "text" DEFAULT 'pcs'::"text" NOT NULL,
    "current_quantity" numeric(12,2) DEFAULT 0 NOT NULL,
    "minimum_quantity" numeric(12,2) DEFAULT 0 NOT NULL,
    "unit_cost" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_items_category_check" CHECK (("category" = ANY (ARRAY['cables'::"text", 'printer_parts'::"text", 'network_devices'::"text", 'accessories'::"text", 'spare_parts'::"text", 'tools'::"text", 'consumables'::"text", 'other'::"text"]))),
    CONSTRAINT "inventory_items_current_quantity_check" CHECK (("current_quantity" >= (0)::numeric)),
    CONSTRAINT "inventory_items_minimum_quantity_check" CHECK (("minimum_quantity" >= (0)::numeric)),
    CONSTRAINT "inventory_items_unit_cost_check" CHECK (("unit_cost" >= (0)::numeric))
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_item_id" "uuid" NOT NULL,
    "movement_type" "text" NOT NULL,
    "quantity" numeric(12,2) NOT NULL,
    "unit_cost" numeric(12,2),
    "field_job_id" "uuid",
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['stock_in'::"text", 'stock_out'::"text", 'adjustment'::"text"]))),
    CONSTRAINT "inventory_movements_quantity_check" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_restock_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restock_order_id" "uuid",
    "inventory_item_id" "uuid",
    "quantity" numeric NOT NULL,
    "unit_cost" numeric NOT NULL,
    "total_cost" numeric NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_restock_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_restock_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "restock_number" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "order_date" "date" NOT NULL,
    "expected_date" "date",
    "received_date" "date",
    "reference" "text",
    "supplier_id" "uuid",
    "total_amount" numeric DEFAULT 0,
    "paid_amount" numeric DEFAULT 0,
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_restock_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "actor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['created'::"text", 'updated'::"text", 'status_changed'::"text", 'note_added'::"text", 'assigned'::"text", 'quotation_created'::"text", 'converted'::"text"])))
);


ALTER TABLE "public"."lead_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lead_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "note_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "follow_up_date" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lead_notes_note_type_check" CHECK (("note_type" = ANY (ARRAY['call'::"text", 'meeting'::"text", 'whatsapp'::"text", 'email'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."lead_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lead_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lead_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "business_type" "text",
    "industry" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "source_id" "uuid",
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "estimated_value" numeric(12,2) DEFAULT 0 NOT NULL,
    "interested_plan" "text" DEFAULT 'unknown'::"text",
    "next_follow_up_at" timestamp with time zone,
    "last_contacted_at" timestamp with time zone,
    "converted_customer_id" "uuid",
    "converted_at" timestamp with time zone,
    "lost_reason" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "leads_interested_plan_check" CHECK (("interested_plan" = ANY (ARRAY['cloud'::"text", 'offline'::"text", 'unknown'::"text"]))),
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'interested'::"text", 'follow_up'::"text", 'closed_won'::"text", 'closed_lost'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_action_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid",
    "project_id" "uuid",
    "customer_id" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "due_date" timestamp with time zone,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_action_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_ai_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid",
    "project_id" "uuid",
    "customer_id" "uuid",
    "summary" "text",
    "key_points" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "decisions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "risks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "next_steps" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "ai_model" "text",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_ai_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_ai_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "tag" "text" NOT NULL,
    "confidence_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_ai_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."nexus_api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_audit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "ip_address" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_channel_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "customer_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "channel_type" "text" DEFAULT 'team'::"text" NOT NULL,
    "visibility" "text" DEFAULT 'internal'::"text" NOT NULL,
    "created_by" "uuid",
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid",
    "project_id" "uuid",
    "customer_id" "uuid",
    "decision" "text" NOT NULL,
    "rationale" "text",
    "decided_by" "uuid",
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_device_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "device_name" "text",
    "device_type" "text",
    "ip_address" "text",
    "user_agent" "text",
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_device_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "embedding" "public"."vector"(1536),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_guest_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "meeting_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "invite_token" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(24), 'hex'::"text") NOT NULL,
    "access_type" "text" DEFAULT 'meeting_guest'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_guest_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_meeting_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "guest_name" "text",
    "guest_email" "text",
    "participant_role" "text" DEFAULT 'participant'::"text" NOT NULL,
    "joined_at" timestamp with time zone,
    "left_at" timestamp with time zone,
    "attendance_seconds" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_meeting_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_meetings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "customer_id" "uuid",
    "channel_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "meeting_type" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "provider" "text" DEFAULT 'livekit'::"text" NOT NULL,
    "room_name" "text",
    "scheduled_start" timestamp with time zone,
    "scheduled_end" timestamp with time zone,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "host_id" "uuid",
    "is_recording_enabled" boolean DEFAULT false NOT NULL,
    "is_ai_enabled" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_meetings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "channel_id" "uuid",
    "sender_id" "uuid",
    "parent_message_id" "uuid",
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_edited" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "max_members" integer,
    "max_monthly_meeting_minutes" integer,
    "max_storage_gb" integer,
    "max_ai_minutes" integer,
    "allow_guests" boolean DEFAULT true NOT NULL,
    "allow_recording" boolean DEFAULT true NOT NULL,
    "allow_ai" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_public_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid",
    "public_slug" "text" NOT NULL,
    "access_mode" "text" DEFAULT 'invite_only'::"text" NOT NULL,
    "waiting_room_enabled" boolean DEFAULT true NOT NULL,
    "password_hash" "text",
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_public_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid",
    "profile_id" "uuid",
    "rate_key" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_recordings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "storage_bucket" "text",
    "storage_path" "text",
    "file_url" "text",
    "file_size" bigint,
    "duration_seconds" integer,
    "status" "text" DEFAULT 'processing'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_recordings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_search_index" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_id" "uuid" NOT NULL,
    "title" "text",
    "content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_search_index" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "status" "text" DEFAULT 'trial'::"text" NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "payment_provider" "text",
    "provider_customer_id" "text",
    "provider_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_transcripts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "meeting_id" "uuid" NOT NULL,
    "recording_id" "uuid",
    "transcript_text" "text",
    "language" "text" DEFAULT 'en'::"text",
    "provider" "text" DEFAULT 'openai'::"text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_transcripts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nexus_usage_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nexus_usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_table" "text",
    "related_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['task'::"text", 'lead'::"text", 'payment'::"text", 'system'::"text", 'quotation'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "organization_type" "text" DEFAULT 'internal'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text",
    "customer_id" "uuid" NOT NULL,
    "quotation_id" "uuid",
    "invoice_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "amount_paid" numeric(12,2) DEFAULT 0 NOT NULL,
    "balance" numeric(12,2) GENERATED ALWAYS AS (("amount" - "amount_paid")) STORED,
    "due_date" "date" NOT NULL,
    "paid_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "billing_period_start" "date",
    "billing_period_end" "date",
    "reference" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_invoices_invoice_type_check" CHECK (("invoice_type" = ANY (ARRAY['setup_fee'::"text", 'subscription'::"text", 'custom'::"text"]))),
    CONSTRAINT "payment_invoices_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'paid'::"text", 'overdue'::"text", 'waived'::"text"])))
);


ALTER TABLE "public"."payment_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "payment_method" "text" DEFAULT 'transfer'::"text",
    "payment_reference" "text",
    "received_by" "uuid",
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payment_transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "payment_transactions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'transfer'::"text", 'card'::"text", 'pos'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pos_deployments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deployment_number" "text" DEFAULT ('DEP-'::"text" || "upper"("substr"(("gen_random_uuid"())::"text", 1, 8))) NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "deployment_type" "text" NOT NULL,
    "terminal_count" integer DEFAULT 1 NOT NULL,
    "deployment_status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "deployed_by" "uuid",
    "install_date" "date",
    "go_live_date" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pos_deployments_deployment_status_check" CHECK (("deployment_status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "pos_deployments_deployment_type_check" CHECK (("deployment_type" = ANY (ARRAY['new_installation'::"text", 'upgrade'::"text", 'replacement'::"text", 'maintenance'::"text"]))),
    CONSTRAINT "pos_deployments_terminal_count_check" CHECK (("terminal_count" >= 1))
);


ALTER TABLE "public"."pos_deployments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "role" "text" NOT NULL,
    "job_title" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "hire_date" "date",
    "birthday" "date",
    "employee_number" "text",
    "username" "text",
    "force_password_change" boolean DEFAULT false NOT NULL,
    "allowed_modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "department" "text",
    CONSTRAINT "profiles_department_check" CHECK ((("department" = ANY (ARRAY['sales'::"text", 'operations'::"text", 'support'::"text", 'engineering'::"text", 'inventory'::"text", 'finance'::"text", 'hr'::"text"])) OR ("department" IS NULL))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'staff'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_task_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "is_done" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_task_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid" NOT NULL,
    "comment" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid",
    "status" "public"."project_task_status" DEFAULT 'todo'::"public"."project_task_status" NOT NULL,
    "priority" "public"."project_priority" DEFAULT 'medium'::"public"."project_priority" NOT NULL,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "project_type" "public"."project_type" NOT NULL,
    "description" "text",
    "default_tasks" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "timeline_type" "text" DEFAULT 'note'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_code" "text" NOT NULL,
    "project_name" "text" NOT NULL,
    "customer_id" "uuid",
    "lead_id" "uuid",
    "quotation_id" "uuid",
    "invoice_id" "uuid",
    "receipt_id" "uuid",
    "project_type" "public"."project_type" NOT NULL,
    "description" "text",
    "project_manager_id" "uuid",
    "start_date" "date",
    "deadline" "date",
    "priority" "public"."project_priority" DEFAULT 'medium'::"public"."project_priority" NOT NULL,
    "status" "public"."project_status" DEFAULT 'planning'::"public"."project_status" NOT NULL,
    "quotation_amount" numeric DEFAULT 0 NOT NULL,
    "amount_paid" numeric DEFAULT 0 NOT NULL,
    "outstanding_balance" numeric GENERATED ALWAYS AS (("quotation_amount" - "amount_paid")) STORED,
    "payment_status" "public"."project_payment_status" DEFAULT 'unpaid'::"public"."project_payment_status" NOT NULL,
    "invoice_number" "text",
    "receipt_number" "text",
    "recurring_revenue" boolean DEFAULT false NOT NULL,
    "annual_renewal_amount" numeric DEFAULT 0 NOT NULL,
    "next_renewal_date" "date",
    "project_cost_estimate" numeric DEFAULT 0 NOT NULL,
    "profit_estimate" numeric GENERATED ALWAYS AS (("quotation_amount" - "project_cost_estimate")) STORED,
    "progress" integer DEFAULT 0 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "projects_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "description" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quotation_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."quotation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quote_number" "text",
    "lead_id" "uuid",
    "customer_id" "uuid",
    "company_name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "discount" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax" numeric(12,2) DEFAULT 0 NOT NULL,
    "total" numeric(12,2) DEFAULT 0 NOT NULL,
    "valid_until" "date",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "quotation_owner_check" CHECK ((("lead_id" IS NOT NULL) OR ("customer_id" IS NOT NULL))),
    CONSTRAINT "quotations_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receipt_number" "text",
    "invoice_id" "uuid",
    "customer_id" "uuid" NOT NULL,
    "payment_transaction_id" "uuid",
    "amount_received" numeric(12,2) NOT NULL,
    "payment_method" "text",
    "payment_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "received_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid" NOT NULL,
    "permission_key" "text" NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "supplier_code" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" "text" DEFAULT ('TKT-'::"text" || "upper"("substr"(("gen_random_uuid"())::"text", 1, 8))) NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "issue_type" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "description" "text",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "asset_id" "uuid",
    "organization_id" "uuid",
    CONSTRAINT "support_tickets_issue_type_check" CHECK (("issue_type" = ANY (ARRAY['hardware'::"text", 'software'::"text", 'network'::"text", 'training'::"text", 'billing'::"text", 'other'::"text"]))),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "task_type" "text" DEFAULT 'general'::"text",
    "related_lead_id" "uuid",
    "related_customer_id" "uuid",
    "assigned_to" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "tasks_task_type_check" CHECK (("task_type" = ANY (ARRAY['follow_up'::"text", 'support'::"text", 'payment'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asset_repair_history"
    ADD CONSTRAINT "asset_repair_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_asset_tag_key" UNIQUE ("asset_tag");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_customer_id_profile_id_key" UNIQUE ("customer_id", "profile_id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_branches"
    ADD CONSTRAINT "customer_branches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_lead_id_key" UNIQUE ("lead_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_staff_id_report_date_key" UNIQUE ("staff_id", "report_date");



ALTER TABLE ONLY "public"."employee_files"
    ADD CONSTRAINT "employee_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_job_inventory_usage"
    ADD CONSTRAINT "field_job_inventory_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_job_materials"
    ADD CONSTRAINT "field_job_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_job_photos"
    ADD CONSTRAINT "field_job_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_job_updates"
    ADD CONSTRAINT "field_job_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_job_number_key" UNIQUE ("job_number");



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_attachments"
    ADD CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_item_code_key" UNIQUE ("item_code");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_restock_order_items"
    ADD CONSTRAINT "inventory_restock_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_restock_orders"
    ADD CONSTRAINT "inventory_restock_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_notes"
    ADD CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lead_sources"
    ADD CONSTRAINT "lead_sources_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."lead_sources"
    ADD CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_ai_summaries"
    ADD CONSTRAINT "nexus_ai_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_ai_tags"
    ADD CONSTRAINT "nexus_ai_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_api_keys"
    ADD CONSTRAINT "nexus_api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_audit_events"
    ADD CONSTRAINT "nexus_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_channel_members"
    ADD CONSTRAINT "nexus_channel_members_channel_id_profile_id_key" UNIQUE ("channel_id", "profile_id");



ALTER TABLE ONLY "public"."nexus_channel_members"
    ADD CONSTRAINT "nexus_channel_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_organization_id_slug_key" UNIQUE ("organization_id", "slug");



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_device_sessions"
    ADD CONSTRAINT "nexus_device_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_embeddings"
    ADD CONSTRAINT "nexus_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_meeting_participants"
    ADD CONSTRAINT "nexus_meeting_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_room_name_key" UNIQUE ("room_name");



ALTER TABLE ONLY "public"."nexus_message_reactions"
    ADD CONSTRAINT "nexus_message_reactions_message_id_profile_id_emoji_key" UNIQUE ("message_id", "profile_id", "emoji");



ALTER TABLE ONLY "public"."nexus_message_reactions"
    ADD CONSTRAINT "nexus_message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_messages"
    ADD CONSTRAINT "nexus_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_plans"
    ADD CONSTRAINT "nexus_plans_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."nexus_plans"
    ADD CONSTRAINT "nexus_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_plans"
    ADD CONSTRAINT "nexus_plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."nexus_public_rooms"
    ADD CONSTRAINT "nexus_public_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_public_rooms"
    ADD CONSTRAINT "nexus_public_rooms_public_slug_key" UNIQUE ("public_slug");



ALTER TABLE ONLY "public"."nexus_rate_limits"
    ADD CONSTRAINT "nexus_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_recordings"
    ADD CONSTRAINT "nexus_recordings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_search_index"
    ADD CONSTRAINT "nexus_search_index_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_subscriptions"
    ADD CONSTRAINT "nexus_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_transcripts"
    ADD CONSTRAINT "nexus_transcripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nexus_usage_events"
    ADD CONSTRAINT "nexus_usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_profile_id_key" UNIQUE ("organization_id", "profile_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."payment_invoices"
    ADD CONSTRAINT "payment_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."payment_invoices"
    ADD CONSTRAINT "payment_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_deployment_number_key" UNIQUE ("deployment_number");



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_staff_id_key" UNIQUE ("project_id", "staff_id");



ALTER TABLE ONLY "public"."project_task_checklists"
    ADD CONSTRAINT "project_task_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_task_comments"
    ADD CONSTRAINT "project_task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_timeline"
    ADD CONSTRAINT "project_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_code_key" UNIQUE ("project_code");



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_quote_number_key" UNIQUE ("quote_number");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_payment_transaction_id_key" UNIQUE ("payment_transaction_id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_key_key" UNIQUE ("role_id", "permission_key");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "asset_repair_history_asset_id_idx" ON "public"."asset_repair_history" USING "btree" ("asset_id");



CREATE INDEX "asset_repair_history_ticket_id_idx" ON "public"."asset_repair_history" USING "btree" ("support_ticket_id");



CREATE INDEX "assets_branch_id_idx" ON "public"."assets" USING "btree" ("branch_id");



CREATE INDEX "assets_customer_id_idx" ON "public"."assets" USING "btree" ("customer_id");



CREATE INDEX "assets_deployment_id_idx" ON "public"."assets" USING "btree" ("deployment_id");



CREATE UNIQUE INDEX "company_settings_single_row_idx" ON "public"."company_settings" USING "btree" ((true));



CREATE INDEX "customer_branches_customer_id_idx" ON "public"."customer_branches" USING "btree" ("customer_id");



CREATE INDEX "employee_files_employee_id_idx" ON "public"."employee_files" USING "btree" ("employee_id");



CREATE INDEX "expenses_category_idx" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "expenses_expense_date_idx" ON "public"."expenses" USING "btree" ("expense_date" DESC);



CREATE INDEX "field_job_inventory_usage_field_job_id_idx" ON "public"."field_job_inventory_usage" USING "btree" ("field_job_id");



CREATE INDEX "field_job_inventory_usage_inventory_item_id_idx" ON "public"."field_job_inventory_usage" USING "btree" ("inventory_item_id");



CREATE INDEX "field_job_materials_field_job_id_idx" ON "public"."field_job_materials" USING "btree" ("field_job_id");



CREATE INDEX "field_job_photos_field_job_id_idx" ON "public"."field_job_photos" USING "btree" ("field_job_id");



CREATE INDEX "field_job_updates_field_job_id_idx" ON "public"."field_job_updates" USING "btree" ("field_job_id");



CREATE INDEX "field_jobs_asset_id_idx" ON "public"."field_jobs" USING "btree" ("asset_id");



CREATE INDEX "field_jobs_assigned_engineer_id_idx" ON "public"."field_jobs" USING "btree" ("assigned_engineer_id");



CREATE INDEX "field_jobs_branch_id_idx" ON "public"."field_jobs" USING "btree" ("branch_id");



CREATE INDEX "field_jobs_customer_id_idx" ON "public"."field_jobs" USING "btree" ("customer_id");



CREATE INDEX "field_jobs_status_idx" ON "public"."field_jobs" USING "btree" ("status");



CREATE INDEX "field_jobs_support_ticket_id_idx" ON "public"."field_jobs" USING "btree" ("support_ticket_id");



CREATE INDEX "file_attachments_related_idx" ON "public"."file_attachments" USING "btree" ("related_table", "related_id");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_customers_account_manager_id" ON "public"."customers" USING "btree" ("account_manager_id");



CREATE INDEX "idx_customers_org" ON "public"."customers" USING "btree" ("organization_id");



CREATE INDEX "idx_customers_status" ON "public"."customers" USING "btree" ("status");



CREATE INDEX "idx_daily_reports_staff_date" ON "public"."daily_reports" USING "btree" ("staff_id", "report_date" DESC);



CREATE INDEX "idx_lead_activities_lead_id" ON "public"."lead_activities" USING "btree" ("lead_id");



CREATE INDEX "idx_lead_notes_lead_id" ON "public"."lead_notes" USING "btree" ("lead_id");



CREATE INDEX "idx_leads_assigned_to" ON "public"."leads" USING "btree" ("assigned_to");



CREATE INDEX "idx_leads_next_follow_up_at" ON "public"."leads" USING "btree" ("next_follow_up_at");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_nexus_action_items_assigned" ON "public"."nexus_action_items" USING "btree" ("assigned_to");



CREATE INDEX "idx_nexus_action_items_org" ON "public"."nexus_action_items" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_action_items_status" ON "public"."nexus_action_items" USING "btree" ("status");



CREATE INDEX "idx_nexus_ai_summaries_meeting" ON "public"."nexus_ai_summaries" USING "btree" ("meeting_id");



CREATE INDEX "idx_nexus_api_keys_org" ON "public"."nexus_api_keys" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_audit_org" ON "public"."nexus_audit_events" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_channel_members_channel" ON "public"."nexus_channel_members" USING "btree" ("channel_id");



CREATE INDEX "idx_nexus_channel_members_profile" ON "public"."nexus_channel_members" USING "btree" ("profile_id");



CREATE INDEX "idx_nexus_channels_customer" ON "public"."nexus_channels" USING "btree" ("customer_id");



CREATE INDEX "idx_nexus_channels_org" ON "public"."nexus_channels" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_channels_project" ON "public"."nexus_channels" USING "btree" ("project_id");



CREATE INDEX "idx_nexus_device_profile" ON "public"."nexus_device_sessions" USING "btree" ("profile_id");



CREATE INDEX "idx_nexus_embeddings_org" ON "public"."nexus_embeddings" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_embeddings_source" ON "public"."nexus_embeddings" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_nexus_meetings_customer" ON "public"."nexus_meetings" USING "btree" ("customer_id");



CREATE INDEX "idx_nexus_meetings_org" ON "public"."nexus_meetings" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_meetings_project" ON "public"."nexus_meetings" USING "btree" ("project_id");



CREATE INDEX "idx_nexus_meetings_scheduled" ON "public"."nexus_meetings" USING "btree" ("scheduled_start");



CREATE INDEX "idx_nexus_meetings_status" ON "public"."nexus_meetings" USING "btree" ("status");



CREATE INDEX "idx_nexus_messages_channel" ON "public"."nexus_messages" USING "btree" ("channel_id");



CREATE INDEX "idx_nexus_messages_created" ON "public"."nexus_messages" USING "btree" ("created_at");



CREATE INDEX "idx_nexus_messages_org" ON "public"."nexus_messages" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_messages_sender" ON "public"."nexus_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_nexus_public_rooms_slug" ON "public"."nexus_public_rooms" USING "btree" ("public_slug");



CREATE INDEX "idx_nexus_recordings_meeting" ON "public"."nexus_recordings" USING "btree" ("meeting_id");



CREATE INDEX "idx_nexus_search_org" ON "public"."nexus_search_index" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_search_source" ON "public"."nexus_search_index" USING "btree" ("source_type", "source_id");



CREATE INDEX "idx_nexus_subscriptions_org" ON "public"."nexus_subscriptions" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_transcripts_meeting" ON "public"."nexus_transcripts" USING "btree" ("meeting_id");



CREATE INDEX "idx_nexus_usage_org" ON "public"."nexus_usage_events" USING "btree" ("organization_id");



CREATE INDEX "idx_nexus_usage_type" ON "public"."nexus_usage_events" USING "btree" ("event_type");



CREATE INDEX "idx_notifications_user_id_read_created_at" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_payment_invoices_customer_status_due" ON "public"."payment_invoices" USING "btree" ("customer_id", "status", "due_date");



CREATE INDEX "idx_payment_transactions_invoice_id" ON "public"."payment_transactions" USING "btree" ("invoice_id");



CREATE INDEX "idx_projects_org" ON "public"."projects" USING "btree" ("organization_id");



CREATE INDEX "idx_quotations_customer_id" ON "public"."quotations" USING "btree" ("customer_id");



CREATE INDEX "idx_quotations_lead_id" ON "public"."quotations" USING "btree" ("lead_id");



CREATE INDEX "idx_quotations_status" ON "public"."quotations" USING "btree" ("status");



CREATE INDEX "idx_support_org" ON "public"."support_tickets" USING "btree" ("organization_id");



CREATE INDEX "idx_tasks_assigned_to_status_due_date" ON "public"."tasks" USING "btree" ("assigned_to", "status", "due_date");



CREATE INDEX "idx_tasks_org" ON "public"."tasks" USING "btree" ("organization_id");



CREATE INDEX "inventory_items_category_idx" ON "public"."inventory_items" USING "btree" ("category");



CREATE INDEX "inventory_movements_field_job_id_idx" ON "public"."inventory_movements" USING "btree" ("field_job_id");



CREATE INDEX "inventory_movements_item_id_idx" ON "public"."inventory_movements" USING "btree" ("inventory_item_id");



CREATE INDEX "pos_deployments_branch_id_idx" ON "public"."pos_deployments" USING "btree" ("branch_id");



CREATE INDEX "pos_deployments_customer_id_idx" ON "public"."pos_deployments" USING "btree" ("customer_id");



CREATE INDEX "pos_deployments_status_idx" ON "public"."pos_deployments" USING "btree" ("deployment_status");



CREATE UNIQUE INDEX "profiles_employee_number_unique_idx" ON "public"."profiles" USING "btree" ("employee_number") WHERE ("employee_number" IS NOT NULL);



CREATE UNIQUE INDEX "profiles_username_unique_idx" ON "public"."profiles" USING "btree" ("username") WHERE ("username" IS NOT NULL);



CREATE INDEX "project_tasks_assigned_to_idx" ON "public"."project_tasks" USING "btree" ("assigned_to");



CREATE INDEX "project_tasks_project_id_idx" ON "public"."project_tasks" USING "btree" ("project_id");



CREATE INDEX "project_timeline_project_id_idx" ON "public"."project_timeline" USING "btree" ("project_id");



CREATE INDEX "projects_customer_id_idx" ON "public"."projects" USING "btree" ("customer_id");



CREATE INDEX "projects_project_manager_id_idx" ON "public"."projects" USING "btree" ("project_manager_id");



CREATE INDEX "projects_project_type_idx" ON "public"."projects" USING "btree" ("project_type");



CREATE INDEX "projects_status_idx" ON "public"."projects" USING "btree" ("status");



CREATE UNIQUE INDEX "suppliers_supplier_code_key" ON "public"."suppliers" USING "btree" ("supplier_code");



CREATE INDEX "support_tickets_asset_id_idx" ON "public"."support_tickets" USING "btree" ("asset_id");



CREATE INDEX "support_tickets_assigned_to_idx" ON "public"."support_tickets" USING "btree" ("assigned_to");



CREATE INDEX "support_tickets_customer_id_idx" ON "public"."support_tickets" USING "btree" ("customer_id");



CREATE INDEX "support_tickets_priority_idx" ON "public"."support_tickets" USING "btree" ("priority");



CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "after_insert_payment_transactions_create_receipt" AFTER INSERT ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."create_receipt_after_payment"();



CREATE OR REPLACE TRIGGER "after_insert_payment_transactions_sync_invoice" AFTER INSERT ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_invoice_payment_status"();



CREATE OR REPLACE TRIGGER "before_insert_customers_assign_code" BEFORE INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."assign_customer_code"();



CREATE OR REPLACE TRIGGER "before_insert_payment_invoices_assign_number" BEFORE INSERT ON "public"."payment_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."assign_invoice_number"();



CREATE OR REPLACE TRIGGER "before_insert_quotations_assign_number" BEFORE INSERT ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."assign_quote_number"();



CREATE OR REPLACE TRIGGER "before_insert_receipts_assign_number" BEFORE INSERT ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."assign_receipt_number"();



CREATE OR REPLACE TRIGGER "set_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_payment_invoices_updated_at" BEFORE UPDATE ON "public"."payment_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_project_code" BEFORE INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."generate_project_code"();



CREATE OR REPLACE TRIGGER "set_project_tasks_updated_at" BEFORE UPDATE ON "public"."project_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_quotations_updated_at" BEFORE UPDATE ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_apply_inventory_movement" AFTER INSERT ON "public"."inventory_movements" FOR EACH ROW EXECUTE FUNCTION "public"."apply_inventory_movement"();



CREATE OR REPLACE TRIGGER "trg_assets_updated_at" BEFORE UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_assets_updated_at"();



CREATE OR REPLACE TRIGGER "trg_company_settings_updated_at" BEFORE UPDATE ON "public"."company_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_settings_updated_at"();



CREATE OR REPLACE TRIGGER "trg_field_jobs_updated_at" BEFORE UPDATE ON "public"."field_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_field_jobs_updated_at"();



CREATE OR REPLACE TRIGGER "trg_inventory_items_updated_at" BEFORE UPDATE ON "public"."inventory_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_items_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pos_deployments_updated_at" BEFORE UPDATE ON "public"."pos_deployments" FOR EACH ROW EXECUTE FUNCTION "public"."update_pos_deployments_updated_at"();



CREATE OR REPLACE TRIGGER "trg_support_ticket_updated_at" BEFORE UPDATE ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_support_ticket_updated_at"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_repair_history"
    ADD CONSTRAINT "asset_repair_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."asset_repair_history"
    ADD CONSTRAINT "asset_repair_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_repair_history"
    ADD CONSTRAINT "asset_repair_history_support_ticket_id_fkey" FOREIGN KEY ("support_ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asset_repair_history"
    ADD CONSTRAINT "asset_repair_history_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."customer_branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "public"."pos_deployments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_branches"
    ADD CONSTRAINT "customer_branches_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."daily_reports"
    ADD CONSTRAINT "daily_reports_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_files"
    ADD CONSTRAINT "employee_files_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_files"
    ADD CONSTRAINT "employee_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_job_inventory_usage"
    ADD CONSTRAINT "field_job_inventory_usage_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_job_inventory_usage"
    ADD CONSTRAINT "field_job_inventory_usage_field_job_id_fkey" FOREIGN KEY ("field_job_id") REFERENCES "public"."field_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_job_inventory_usage"
    ADD CONSTRAINT "field_job_inventory_usage_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_job_materials"
    ADD CONSTRAINT "field_job_materials_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_job_materials"
    ADD CONSTRAINT "field_job_materials_field_job_id_fkey" FOREIGN KEY ("field_job_id") REFERENCES "public"."field_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_job_photos"
    ADD CONSTRAINT "field_job_photos_field_job_id_fkey" FOREIGN KEY ("field_job_id") REFERENCES "public"."field_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_job_photos"
    ADD CONSTRAINT "field_job_photos_file_attachment_id_fkey" FOREIGN KEY ("file_attachment_id") REFERENCES "public"."file_attachments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_job_photos"
    ADD CONSTRAINT "field_job_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_job_updates"
    ADD CONSTRAINT "field_job_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_job_updates"
    ADD CONSTRAINT "field_job_updates_field_job_id_fkey" FOREIGN KEY ("field_job_id") REFERENCES "public"."field_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_assigned_engineer_id_fkey" FOREIGN KEY ("assigned_engineer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."customer_branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_jobs"
    ADD CONSTRAINT "field_jobs_support_ticket_id_fkey" FOREIGN KEY ("support_ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."file_attachments"
    ADD CONSTRAINT "file_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_field_job_id_fkey" FOREIGN KEY ("field_job_id") REFERENCES "public"."field_jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_restock_order_items"
    ADD CONSTRAINT "inventory_restock_order_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id");



ALTER TABLE ONLY "public"."inventory_restock_order_items"
    ADD CONSTRAINT "inventory_restock_order_items_restock_order_id_fkey" FOREIGN KEY ("restock_order_id") REFERENCES "public"."inventory_restock_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_restock_orders"
    ADD CONSTRAINT "inventory_restock_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_activities"
    ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lead_notes"
    ADD CONSTRAINT "lead_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lead_notes"
    ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_converted_customer_id_fkey" FOREIGN KEY ("converted_customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_action_items"
    ADD CONSTRAINT "nexus_action_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_ai_summaries"
    ADD CONSTRAINT "nexus_ai_summaries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_ai_summaries"
    ADD CONSTRAINT "nexus_ai_summaries_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_ai_summaries"
    ADD CONSTRAINT "nexus_ai_summaries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_ai_summaries"
    ADD CONSTRAINT "nexus_ai_summaries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_ai_tags"
    ADD CONSTRAINT "nexus_ai_tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_api_keys"
    ADD CONSTRAINT "nexus_api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_api_keys"
    ADD CONSTRAINT "nexus_api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_audit_events"
    ADD CONSTRAINT "nexus_audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_audit_events"
    ADD CONSTRAINT "nexus_audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_channel_members"
    ADD CONSTRAINT "nexus_channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."nexus_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_channel_members"
    ADD CONSTRAINT "nexus_channel_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_channels"
    ADD CONSTRAINT "nexus_channels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_decisions"
    ADD CONSTRAINT "nexus_decisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_device_sessions"
    ADD CONSTRAINT "nexus_device_sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_embeddings"
    ADD CONSTRAINT "nexus_embeddings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_guest_invites"
    ADD CONSTRAINT "nexus_guest_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_meeting_participants"
    ADD CONSTRAINT "nexus_meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_meeting_participants"
    ADD CONSTRAINT "nexus_meeting_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."nexus_channels"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_meetings"
    ADD CONSTRAINT "nexus_meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_message_reactions"
    ADD CONSTRAINT "nexus_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."nexus_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_message_reactions"
    ADD CONSTRAINT "nexus_message_reactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_messages"
    ADD CONSTRAINT "nexus_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."nexus_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_messages"
    ADD CONSTRAINT "nexus_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_messages"
    ADD CONSTRAINT "nexus_messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."nexus_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_messages"
    ADD CONSTRAINT "nexus_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_public_rooms"
    ADD CONSTRAINT "nexus_public_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_public_rooms"
    ADD CONSTRAINT "nexus_public_rooms_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_public_rooms"
    ADD CONSTRAINT "nexus_public_rooms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_rate_limits"
    ADD CONSTRAINT "nexus_rate_limits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_rate_limits"
    ADD CONSTRAINT "nexus_rate_limits_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_recordings"
    ADD CONSTRAINT "nexus_recordings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."nexus_recordings"
    ADD CONSTRAINT "nexus_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_recordings"
    ADD CONSTRAINT "nexus_recordings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_search_index"
    ADD CONSTRAINT "nexus_search_index_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_subscriptions"
    ADD CONSTRAINT "nexus_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_subscriptions"
    ADD CONSTRAINT "nexus_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."nexus_plans"("id");



ALTER TABLE ONLY "public"."nexus_transcripts"
    ADD CONSTRAINT "nexus_transcripts_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."nexus_meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_transcripts"
    ADD CONSTRAINT "nexus_transcripts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nexus_transcripts"
    ADD CONSTRAINT "nexus_transcripts_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "public"."nexus_recordings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."nexus_usage_events"
    ADD CONSTRAINT "nexus_usage_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payment_invoices"
    ADD CONSTRAINT "payment_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_invoices"
    ADD CONSTRAINT "payment_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_invoices"
    ADD CONSTRAINT "payment_invoices_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."payment_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."customer_branches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pos_deployments"
    ADD CONSTRAINT "pos_deployments_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_checklists"
    ADD CONSTRAINT "project_task_checklists_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_task_comments"
    ADD CONSTRAINT "project_task_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_task_comments"
    ADD CONSTRAINT "project_task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_tasks"
    ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_templates"
    ADD CONSTRAINT "project_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_timeline"
    ADD CONSTRAINT "project_timeline_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_timeline"
    ADD CONSTRAINT "project_timeline_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."payment_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."payment_invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_customer_id_fkey" FOREIGN KEY ("related_customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_lead_id_fkey" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;



CREATE POLICY "Allow authenticated delete project timeline" ON "public"."project_timeline" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read project timeline" ON "public"."project_timeline" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update own project timeline" ON "public"."project_timeline" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated full access project_members" ON "public"."project_members" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can create projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can delete projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Staff can insert project timeline" ON "public"."project_timeline" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_logs_insert_authenticated" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "activity_logs_select_authenticated" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "admins can manage channel members" ON "public"."nexus_channel_members" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."nexus_channels" "c"
  WHERE (("c"."id" = "nexus_channel_members"."channel_id") AND "public"."is_org_admin"("c"."organization_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."nexus_channels" "c"
  WHERE (("c"."id" = "nexus_channel_members"."channel_id") AND "public"."is_org_admin"("c"."organization_id")))));



CREATE POLICY "admins can update nexus channels" ON "public"."nexus_channels" FOR UPDATE TO "authenticated" USING ("public"."is_org_admin"("organization_id")) WITH CHECK ("public"."is_org_admin"("organization_id"));



ALTER TABLE "public"."asset_repair_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "asset_repair_history_insert_authenticated" ON "public"."asset_repair_history" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "asset_repair_history_select_authenticated" ON "public"."asset_repair_history" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "asset_repair_history_update_authenticated" ON "public"."asset_repair_history" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assets_insert_admin_only" ON "public"."assets" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "assets_select_authenticated" ON "public"."assets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "assets_update_admin_only" ON "public"."assets" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "assigned user or admin can update action items" ON "public"."nexus_action_items" FOR UPDATE TO "authenticated" USING ((("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))) WITH CHECK ((("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id")));



CREATE POLICY "authenticated users can view memberships" ON "public"."organization_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated users can view organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."client_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_settings_insert_admin_only" ON "public"."company_settings" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "company_settings_select_authenticated" ON "public"."company_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "company_settings_update_admin_only" ON "public"."company_settings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."customer_branches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_branches_insert_admin_only" ON "public"."customer_branches" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "customer_branches_select_authenticated" ON "public"."customer_branches" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "customer_branches_update_admin_only" ON "public"."customer_branches" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_insert_authenticated" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "customers_select_assigned_or_creator_or_admin" ON "public"."customers" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("account_manager_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR ("lead_id" IN ( SELECT "leads"."id"
   FROM "public"."leads"
  WHERE (("leads"."assigned_to" = "auth"."uid"()) OR ("leads"."created_by" = "auth"."uid"()))))));



CREATE POLICY "customers_update_assigned_or_admin" ON "public"."customers" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("account_manager_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."daily_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_reports_insert_own_or_admin" ON "public"."daily_reports" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR ("staff_id" = "auth"."uid"())));



CREATE POLICY "daily_reports_select_own_or_admin" ON "public"."daily_reports" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("staff_id" = "auth"."uid"())));



CREATE POLICY "daily_reports_update_own_or_admin" ON "public"."daily_reports" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("staff_id" = "auth"."uid"())));



ALTER TABLE "public"."employee_files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_files_delete_authenticated" ON "public"."employee_files" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "employee_files_insert_authenticated" ON "public"."employee_files" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "employee_files_select_authenticated" ON "public"."employee_files" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_delete_admin_only" ON "public"."expenses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "expenses_insert_admin_only" ON "public"."expenses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "expenses_select_authenticated" ON "public"."expenses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "expenses_update_admin_only" ON "public"."expenses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."field_job_inventory_usage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_job_inventory_usage_insert_authenticated" ON "public"."field_job_inventory_usage" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "field_job_inventory_usage_select_authenticated" ON "public"."field_job_inventory_usage" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."field_job_materials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_job_materials_insert_authenticated" ON "public"."field_job_materials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "field_job_materials_select_authenticated" ON "public"."field_job_materials" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."field_job_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_job_photos_insert_authenticated" ON "public"."field_job_photos" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "field_job_photos_select_authenticated" ON "public"."field_job_photos" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."field_job_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_job_updates_insert_authenticated" ON "public"."field_job_updates" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "field_job_updates_select_authenticated" ON "public"."field_job_updates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."field_jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "field_jobs_insert_authenticated" ON "public"."field_jobs" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "field_jobs_select_authenticated" ON "public"."field_jobs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "field_jobs_update_authenticated" ON "public"."field_jobs" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."file_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "file_attachments_insert_authenticated" ON "public"."file_attachments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "uploaded_by"));



CREATE POLICY "file_attachments_select_authenticated" ON "public"."file_attachments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "host or admin can update meetings" ON "public"."nexus_meetings" FOR UPDATE TO "authenticated" USING ((("host_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id"))) WITH CHECK ((("host_id" = "auth"."uid"()) OR ("created_by" = "auth"."uid"()) OR "public"."is_org_admin"("organization_id")));



ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_items_insert_authenticated" ON "public"."inventory_items" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "inventory_items_select_authenticated" ON "public"."inventory_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "inventory_items_update_authenticated" ON "public"."inventory_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_movements_insert_authenticated" ON "public"."inventory_movements" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "inventory_movements_select_authenticated" ON "public"."inventory_movements" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."inventory_restock_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_restock_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lead_activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_activities_insert_authenticated" ON "public"."lead_activities" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "lead_activities_select_related_lead_access" ON "public"."lead_activities" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "lead_activities"."lead_id") AND (("l"."assigned_to" = "auth"."uid"()) OR ("l"."created_by" = "auth"."uid"())))))));



ALTER TABLE "public"."lead_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_notes_insert_related_lead_access" ON "public"."lead_notes" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "lead_notes"."lead_id") AND (("l"."assigned_to" = "auth"."uid"()) OR ("l"."created_by" = "auth"."uid"())))))));



CREATE POLICY "lead_notes_select_related_lead_access" ON "public"."lead_notes" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "lead_notes"."lead_id") AND (("l"."assigned_to" = "auth"."uid"()) OR ("l"."created_by" = "auth"."uid"())))))));



ALTER TABLE "public"."lead_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lead_sources_read_authenticated" ON "public"."lead_sources" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_insert_authenticated" ON "public"."leads" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "leads_select_assigned_or_admin" ON "public"."leads" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "leads_update_assigned_or_admin" ON "public"."leads" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."nexus_action_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_ai_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_ai_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_channel_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_decisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_device_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_guest_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_meeting_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_meetings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_public_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_recordings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_search_index" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_transcripts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nexus_usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_insert_authenticated" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "org members can create action items" ON "public"."nexus_action_items" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can create meetings" ON "public"."nexus_meetings" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_org_member"("organization_id") AND ("created_by" = "auth"."uid"())));



CREATE POLICY "org members can create nexus channels" ON "public"."nexus_channels" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can send messages" ON "public"."nexus_messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_org_member"("organization_id") AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "org members can view action items" ON "public"."nexus_action_items" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view ai summaries" ON "public"."nexus_ai_summaries" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view channel members" ON "public"."nexus_channel_members" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."nexus_channels" "c"
  WHERE (("c"."id" = "nexus_channel_members"."channel_id") AND "public"."is_org_member"("c"."organization_id")))));



CREATE POLICY "org members can view decisions" ON "public"."nexus_decisions" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view embeddings" ON "public"."nexus_embeddings" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view meetings" ON "public"."nexus_meetings" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view messages" ON "public"."nexus_messages" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view nexus channels" ON "public"."nexus_channels" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view recordings" ON "public"."nexus_recordings" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view search index" ON "public"."nexus_search_index" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "org members can view transcripts" ON "public"."nexus_transcripts" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));



ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_invoices_insert_authenticated" ON "public"."payment_invoices" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "payment_invoices_select_scope_or_admin" ON "public"."payment_invoices" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "payment_invoices"."customer_id") AND (("c"."account_manager_id" = "auth"."uid"()) OR ("c"."created_by" = "auth"."uid"()))))) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "payment_invoices_update_creator_or_admin" ON "public"."payment_invoices" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_transactions_insert_authenticated" ON "public"."payment_transactions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "payment_transactions_select_scope_or_admin" ON "public"."payment_transactions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("received_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "payment_transactions"."customer_id") AND (("c"."account_manager_id" = "auth"."uid"()) OR ("c"."created_by" = "auth"."uid"())))))));



ALTER TABLE "public"."pos_deployments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pos_deployments_insert_admin_only" ON "public"."pos_deployments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "pos_deployments_select_authenticated" ON "public"."pos_deployments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "pos_deployments_update_admin_only" ON "public"."pos_deployments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_update_own_or_admin" ON "public"."profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_task_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quotation_items_insert_if_parent_visible" ON "public"."quotation_items" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."quotations" "q"
  WHERE (("q"."id" = "quotation_items"."quotation_id") AND ("q"."created_by" = "auth"."uid"()))))));



CREATE POLICY "quotation_items_select_if_parent_visible" ON "public"."quotation_items" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."quotations" "q"
  WHERE (("q"."id" = "quotation_items"."quotation_id") AND (("q"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."leads" "l"
          WHERE (("l"."id" = "q"."lead_id") AND (("l"."assigned_to" = "auth"."uid"()) OR ("l"."created_by" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
           FROM "public"."customers" "c"
          WHERE (("c"."id" = "q"."customer_id") AND (("c"."account_manager_id" = "auth"."uid"()) OR ("c"."created_by" = "auth"."uid"())))))))))));



CREATE POLICY "quotation_items_update_if_parent_visible" ON "public"."quotation_items" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."quotations" "q"
  WHERE (("q"."id" = "quotation_items"."quotation_id") AND ("q"."created_by" = "auth"."uid"()))))));



ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quotations_insert_authenticated" ON "public"."quotations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "quotations_select_staff_scope_or_admin" ON "public"."quotations" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."leads" "l"
  WHERE (("l"."id" = "quotations"."lead_id") AND (("l"."assigned_to" = "auth"."uid"()) OR ("l"."created_by" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "quotations"."customer_id") AND (("c"."account_manager_id" = "auth"."uid"()) OR ("c"."created_by" = "auth"."uid"())))))));



CREATE POLICY "quotations_update_creator_or_admin" ON "public"."quotations" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "receipts_insert_authenticated" ON "public"."receipts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "receipts_select_scope_or_admin" ON "public"."receipts" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("received_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "receipts"."customer_id") AND (("c"."account_manager_id" = "auth"."uid"()) OR ("c"."created_by" = "auth"."uid"())))))));



ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sender can update own messages" ON "public"."nexus_messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"())) WITH CHECK (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "support_tickets_delete_admin_only" ON "public"."support_tickets" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "support_tickets_insert_authenticated" ON "public"."support_tickets" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "support_tickets_select_authenticated" ON "public"."support_tickets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "support_tickets_update_authenticated" ON "public"."support_tickets" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_insert_authenticated" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "tasks_select_assignee_or_admin" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR ("assigned_to" = "auth"."uid"()) OR ("assigned_by" = "auth"."uid"())));



CREATE POLICY "tasks_update_assignee_or_admin" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("assigned_to" = "auth"."uid"()) OR ("assigned_by" = "auth"."uid"())));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_inventory_movement"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_inventory_movement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_inventory_movement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_customer_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_customer_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_customer_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_receipt_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_receipt_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_receipt_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."convert_lead_to_customer"("p_lead_id" "uuid", "p_plan_type" "text", "p_setup_fee" numeric, "p_subscription_amount" numeric, "p_billing_cycle" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."convert_lead_to_customer"("p_lead_id" "uuid", "p_plan_type" "text", "p_setup_fee" numeric, "p_subscription_amount" numeric, "p_billing_cycle" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."convert_lead_to_customer"("p_lead_id" "uuid", "p_plan_type" "text", "p_setup_fee" numeric, "p_subscription_amount" numeric, "p_billing_cycle" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_receipt_after_payment"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_receipt_after_payment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_receipt_after_payment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_customer_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_project_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_project_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_project_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_quote_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_receipt_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_system_reminders"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_system_reminders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_system_reminders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text", "p_actor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text", "p_actor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."issue_field_job_inventory"("p_field_job_id" "uuid", "p_inventory_item_id" "uuid", "p_quantity" numeric, "p_notes" "text", "p_actor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_overdue_invoices"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_overdue_invoices"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_overdue_invoices"() TO "service_role";



GRANT ALL ON FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric, "p_field_job_id" "uuid", "p_note" "text", "p_actor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric, "p_field_job_id" "uuid", "p_note" "text", "p_actor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."post_inventory_movement"("p_inventory_item_id" "uuid", "p_movement_type" "text", "p_quantity" numeric, "p_unit_cost" numeric, "p_field_job_id" "uuid", "p_note" "text", "p_actor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_invoice_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_invoice_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_invoice_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_assets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_assets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_assets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_settings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_settings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_settings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_field_jobs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_field_jobs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_field_jobs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_items_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_items_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_items_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pos_deployments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pos_deployments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pos_deployments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_support_ticket_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_support_ticket_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_support_ticket_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."asset_repair_history" TO "anon";
GRANT ALL ON TABLE "public"."asset_repair_history" TO "authenticated";
GRANT ALL ON TABLE "public"."asset_repair_history" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."client_users" TO "anon";
GRANT ALL ON TABLE "public"."client_users" TO "authenticated";
GRANT ALL ON TABLE "public"."client_users" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."customer_branches" TO "anon";
GRANT ALL ON TABLE "public"."customer_branches" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_branches" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_reports" TO "service_role";



GRANT ALL ON TABLE "public"."employee_files" TO "anon";
GRANT ALL ON TABLE "public"."employee_files" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_files" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."field_job_inventory_usage" TO "anon";
GRANT ALL ON TABLE "public"."field_job_inventory_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."field_job_inventory_usage" TO "service_role";



GRANT ALL ON TABLE "public"."field_job_materials" TO "anon";
GRANT ALL ON TABLE "public"."field_job_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."field_job_materials" TO "service_role";



GRANT ALL ON TABLE "public"."field_job_photos" TO "anon";
GRANT ALL ON TABLE "public"."field_job_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."field_job_photos" TO "service_role";



GRANT ALL ON TABLE "public"."field_job_updates" TO "anon";
GRANT ALL ON TABLE "public"."field_job_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."field_job_updates" TO "service_role";



GRANT ALL ON TABLE "public"."field_jobs" TO "anon";
GRANT ALL ON TABLE "public"."field_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."field_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."file_attachments" TO "anon";
GRANT ALL ON TABLE "public"."file_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."file_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_restock_order_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_restock_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_restock_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_restock_orders" TO "anon";
GRANT ALL ON TABLE "public"."inventory_restock_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_restock_orders" TO "service_role";



GRANT ALL ON TABLE "public"."lead_activities" TO "anon";
GRANT ALL ON TABLE "public"."lead_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_activities" TO "service_role";



GRANT ALL ON TABLE "public"."lead_notes" TO "anon";
GRANT ALL ON TABLE "public"."lead_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_notes" TO "service_role";



GRANT ALL ON TABLE "public"."lead_sources" TO "anon";
GRANT ALL ON TABLE "public"."lead_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."lead_sources" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_action_items" TO "anon";
GRANT ALL ON TABLE "public"."nexus_action_items" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_action_items" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_ai_summaries" TO "anon";
GRANT ALL ON TABLE "public"."nexus_ai_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_ai_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_ai_tags" TO "anon";
GRANT ALL ON TABLE "public"."nexus_ai_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_ai_tags" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_api_keys" TO "anon";
GRANT ALL ON TABLE "public"."nexus_api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_audit_events" TO "anon";
GRANT ALL ON TABLE "public"."nexus_audit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_audit_events" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_channel_members" TO "anon";
GRANT ALL ON TABLE "public"."nexus_channel_members" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_channel_members" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_channels" TO "anon";
GRANT ALL ON TABLE "public"."nexus_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_channels" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_decisions" TO "anon";
GRANT ALL ON TABLE "public"."nexus_decisions" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_decisions" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_device_sessions" TO "anon";
GRANT ALL ON TABLE "public"."nexus_device_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_device_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."nexus_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_guest_invites" TO "anon";
GRANT ALL ON TABLE "public"."nexus_guest_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_guest_invites" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_meeting_participants" TO "anon";
GRANT ALL ON TABLE "public"."nexus_meeting_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_meeting_participants" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_meetings" TO "anon";
GRANT ALL ON TABLE "public"."nexus_meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_meetings" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."nexus_message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_messages" TO "anon";
GRANT ALL ON TABLE "public"."nexus_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_messages" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_plans" TO "anon";
GRANT ALL ON TABLE "public"."nexus_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_plans" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_public_rooms" TO "anon";
GRANT ALL ON TABLE "public"."nexus_public_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_public_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."nexus_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_recordings" TO "anon";
GRANT ALL ON TABLE "public"."nexus_recordings" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_recordings" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_search_index" TO "anon";
GRANT ALL ON TABLE "public"."nexus_search_index" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_search_index" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."nexus_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_transcripts" TO "anon";
GRANT ALL ON TABLE "public"."nexus_transcripts" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_transcripts" TO "service_role";



GRANT ALL ON TABLE "public"."nexus_usage_events" TO "anon";
GRANT ALL ON TABLE "public"."nexus_usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."nexus_usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."payment_invoices" TO "anon";
GRANT ALL ON TABLE "public"."payment_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."pos_deployments" TO "anon";
GRANT ALL ON TABLE "public"."pos_deployments" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_deployments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_checklists" TO "anon";
GRANT ALL ON TABLE "public"."project_task_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."project_task_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."project_tasks" TO "anon";
GRANT ALL ON TABLE "public"."project_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."project_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."project_templates" TO "anon";
GRANT ALL ON TABLE "public"."project_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."project_templates" TO "service_role";



GRANT ALL ON TABLE "public"."project_timeline" TO "anon";
GRANT ALL ON TABLE "public"."project_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."project_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_items" TO "anon";
GRANT ALL ON TABLE "public"."quotation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







