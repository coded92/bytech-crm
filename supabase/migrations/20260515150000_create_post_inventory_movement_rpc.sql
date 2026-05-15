-- BYTECH CRM Phase 5B-1
-- Purpose:
--   Create the canonical public.post_inventory_movement RPC for transaction-safe
--   inventory balance updates and inventory movement logging.
--
-- Scope:
--   This migration touches only the public schema owned by BYTECH CRM.
--   It does not touch nexus or ai schemas.
--
-- Safety:
--   The function is SECURITY INVOKER so normal Supabase/RLS permissions still
--   apply to the calling authenticated user.
--   The target inventory_items row is locked with FOR UPDATE for the duration
--   of the function transaction.

create or replace function public.post_inventory_movement(
  p_inventory_item_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_unit_cost numeric default null,
  p_field_job_id uuid default null,
  p_note text default null,
  p_actor_id uuid default null
)
returns table (
  movement_id uuid,
  inventory_item_id uuid,
  movement_type text,
  quantity numeric,
  unit_cost numeric,
  field_job_id uuid,
  note text,
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
  v_item public.inventory_items%rowtype;
  v_previous_quantity numeric;
  v_new_quantity numeric;
  v_movement public.inventory_movements%rowtype;
  v_actor_id uuid;
begin
  -- Validate required identifiers and business inputs before locking.
  if p_inventory_item_id is null then
    raise exception 'Inventory item is required'
      using errcode = '22023';
  end if;

  -- SECURITY INVOKER means RLS still applies. inventory_movements INSERT
  -- policy requires created_by = auth.uid(), so never trust a mismatched actor.
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

  -- Lock the inventory row to make concurrent writes serialize safely.
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
    v_new_quantity := v_previous_quantity + p_quantity;
  elsif p_movement_type = 'stock_out' then
    v_new_quantity := v_previous_quantity - p_quantity;
  end if;

  -- Guard stock correctness before writing either the balance or movement row.
  if v_new_quantity < 0 then
    raise exception 'Insufficient stock. Available: %, requested: %',
      v_previous_quantity,
      p_quantity
      using errcode = '23514';
  end if;

  update public.inventory_items
  set
    current_quantity = v_new_quantity,
    updated_at = now()
  where id = p_inventory_item_id;

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
      v_new_quantity
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
    v_new_quantity,
    v_movement.created_by,
    v_movement.created_at;
end;
$$;

comment on function public.post_inventory_movement(
  uuid,
  text,
  numeric,
  numeric,
  uuid,
  text,
  uuid
) is
  'Posts an inventory stock movement atomically: locks inventory_items, validates stock, updates current_quantity, inserts inventory_movements, and writes activity_logs.';

grant execute on function public.post_inventory_movement(
  uuid,
  text,
  numeric,
  numeric,
  uuid,
  text,
  uuid
) to authenticated;
