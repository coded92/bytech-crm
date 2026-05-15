-- BYTECH CRM Phase 5C-2
-- Purpose:
--   Create public.issue_field_job_inventory for atomic field-job inventory issue.
--
-- Scope:
--   This migration touches only the public schema owned by BYTECH CRM.
--   It does not touch nexus or ai schemas.
--
-- Trigger-aware inventory behavior:
--   The live CRM database has inventory_movements trigger
--   trg_apply_inventory_movement, whose function apply_inventory_movement()
--   updates inventory_items.current_quantity. This RPC therefore does not
--   manually update inventory_items.current_quantity. It validates stock before
--   inserting the movement, then verifies the trigger applied exactly the
--   expected stock-out quantity.

create or replace function public.issue_field_job_inventory(
  p_field_job_id uuid,
  p_inventory_item_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_actor_id uuid default null
)
returns table (
  usage_id uuid,
  movement_id uuid,
  field_job_id uuid,
  inventory_item_id uuid,
  quantity numeric,
  unit_cost numeric,
  total_cost numeric,
  previous_quantity numeric,
  new_quantity numeric,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
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

comment on function public.issue_field_job_inventory(
  uuid,
  uuid,
  numeric,
  text,
  uuid
) is
  'Atomically issues inventory to a field job by inserting field_job_inventory_usage, inserting one stock_out inventory_movements row, and verifying trg_apply_inventory_movement applied the expected stock change.';

grant execute on function public.issue_field_job_inventory(
  uuid,
  uuid,
  numeric,
  text,
  uuid
) to authenticated;

