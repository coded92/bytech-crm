import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type StockMovementType = "stock_in" | "stock_out" | "adjustment";

type InventoryItemRow = {
  id: string;
  item_name: string;
  current_quantity: number | string | null;
};

type InventoryQuantityRow = {
  current_quantity: number | string | null;
};

type StockMovementArgs = {
  supabase: SupabaseServerClient;
  inventoryItemId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  fieldJobId?: string | null;
  note?: string | null;
  actorId: string;
};

type InventoryRpcMovementRow = {
  movement_id: string;
  inventory_item_id: string;
  movement_type: StockMovementType;
  quantity: number | string;
  unit_cost: number | string | null;
  field_job_id: string | null;
  note: string | null;
  previous_quantity: number | string;
  new_quantity: number | string;
  created_by: string;
  created_at: string;
};

function logInventoryStockPath(
  path: "RPC_MODE" | "LEGACY_MODE",
  args: Pick<
    StockMovementArgs,
    "inventoryItemId" | "movementType" | "quantity" | "fieldJobId"
  >
) {
  const rawFlag = process.env.USE_INVENTORY_RPC;

  console.info("[inventory-stock-integrity]", {
    raw_USE_INVENTORY_RPC: rawFlag ?? null,
    parsed_USE_INVENTORY_RPC: rawFlag === "true",
    path,
    inventoryItemId: args.inventoryItemId,
    movementType: args.movementType,
    quantity: args.quantity,
    fieldJobId: args.fieldJobId ?? null,
  });
}

function shouldUseInventoryRpc() {
  return process.env.USE_INVENTORY_RPC === "true";
}

function assertLegacyStockMode() {
  if (shouldUseInventoryRpc()) {
    throw new Error(
      "Invariant violation: legacy inventory stock logic cannot run while USE_INVENTORY_RPC=true."
    );
  }
}

function getNextQuantity(
  currentQuantity: number,
  movementType: StockMovementType,
  quantity: number
):
  | { nextQuantity: number; signedQuantity: number }
  | { error: string } {
  if (quantity <= 0) {
    return { error: "Quantity must be greater than zero." };
  }

  if (movementType === "stock_in" || movementType === "adjustment") {
    return {
      nextQuantity: currentQuantity + quantity,
      signedQuantity: quantity,
    };
  }

  const nextQuantity = currentQuantity - quantity;

  if (nextQuantity < 0) {
    return { error: "Stock cannot go below zero." };
  }

  return {
    nextQuantity,
    signedQuantity: -quantity,
  };
}

async function getInventoryCurrentQuantity(
  supabase: SupabaseServerClient,
  inventoryItemId: string
) {
  const { data, error } = await (supabase as any)
    .from("inventory_items")
    .select("current_quantity")
    .eq("id", inventoryItemId)
    .maybeSingle();

  const item = data as InventoryQuantityRow | null;

  if (error || !item) {
    return {
      error:
        error?.message ??
        "Inventory item quantity could not be refreshed after movement insert.",
    };
  }

  return {
    currentQuantity: Number(item.current_quantity || 0),
  };
}

function normalizeRpcMovement(data: unknown): InventoryRpcMovementRow | null {
  if (Array.isArray(data)) {
    return (data[0] as InventoryRpcMovementRow | undefined) ?? null;
  }

  return (data as InventoryRpcMovementRow | null) ?? null;
}

async function postStockMovementWithRpc(args: StockMovementArgs) {
  logInventoryStockPath("RPC_MODE", args);

  const {
    supabase,
    inventoryItemId,
    movementType,
    quantity,
    unitCost = null,
    fieldJobId = null,
    note = null,
  } = args;

  // Phase 5B controlled rollout:
  // RPC mode is authoritative and atomic. The database function updates
  // inventory_items.current_quantity, inserts inventory_movements, and writes
  // audit logs in one transaction. Do not run legacy app-side balance updates,
  // movement inserts, or compensating rollback logic after this path succeeds.
  //
  // Use the authenticated Supabase server client so auth.uid() is available
  // inside the security invoker RPC. Do not pass p_actor_id here; the RPC
  // validates/defaults the actor from the current database auth context.
  const { data, error } = await (supabase as any).rpc("post_inventory_movement", {
    p_inventory_item_id: inventoryItemId,
    p_movement_type: movementType,
    p_quantity: quantity,
    p_unit_cost: unitCost,
    p_field_job_id: fieldJobId,
    p_note: note,
  });

  if (error) {
    return { error: `Inventory RPC failed: ${error.message}` };
  }

  const movement = normalizeRpcMovement(data);

  if (!movement) {
    return { error: "Inventory RPC did not return a movement row." };
  }

  const { data: itemData, error: itemError } = await (supabase as any)
    .from("inventory_items")
    .select("id, item_name")
    .eq("id", inventoryItemId)
    .maybeSingle();

  const item = itemData as Pick<InventoryItemRow, "id" | "item_name"> | null;

  if (itemError || !item) {
    return {
      error:
        itemError?.message ??
        "Inventory movement posted, but the item could not be refreshed.",
    };
  }

  return {
    item: {
      id: item.id,
      itemName: item.item_name,
      previousQuantity: Number(movement.previous_quantity || 0),
      currentQuantity: Number(movement.new_quantity || 0),
    },
    movement: { id: movement.movement_id },
  };
}

async function postStockMovementWithAppLogic(args: StockMovementArgs) {
  assertLegacyStockMode();
  logInventoryStockPath("LEGACY_MODE", args);

  const {
    supabase,
    inventoryItemId,
    movementType,
    quantity,
    unitCost = null,
    fieldJobId = null,
    note = null,
    actorId,
  } = args;

  // Legacy fallback mode. Some existing databases also maintain stock from an
  // inventory_movements insert trigger. To avoid applying the same movement
  // twice, insert the movement first, then only manually update
  // inventory_items.current_quantity if the insert did not already change it.
  const { data: itemData, error: itemError } = await (supabase as any)
    .from("inventory_items")
    .select("id, item_name, current_quantity")
    .eq("id", inventoryItemId)
    .maybeSingle();

  const item = itemData as InventoryItemRow | null;

  if (itemError || !item) {
    return { error: itemError?.message ?? "Inventory item not found." };
  }

  const currentQuantity = Number(item.current_quantity || 0);
  const nextQuantityResult = getNextQuantity(
    currentQuantity,
    movementType,
    quantity
  );

  if ("error" in nextQuantityResult) {
    return { error: nextQuantityResult.error };
  }

  const { nextQuantity } = nextQuantityResult;

  const { data: movementData, error: movementError } = await (supabase as any)
    .from("inventory_movements")
    .insert({
      inventory_item_id: inventoryItemId,
      movement_type: movementType,
      quantity,
      unit_cost: unitCost,
      field_job_id: fieldJobId,
      note,
      created_by: actorId,
    })
    .select("id")
    .single();

  if (movementError || !movementData) {
    return { error: movementError?.message ?? "Failed to record stock movement." };
  }

  const quantityAfterInsertResult = await getInventoryCurrentQuantity(
    supabase,
    inventoryItemId
  );

  if ("error" in quantityAfterInsertResult) {
    await (supabase as any)
      .from("inventory_movements")
      .delete()
      .eq("id", (movementData as { id: string }).id);

    return { error: quantityAfterInsertResult.error };
  }

  let finalQuantity = quantityAfterInsertResult.currentQuantity;

  if (finalQuantity === currentQuantity) {
    const { data: updatedItemData, error: updateError } = await (supabase as any)
      .from("inventory_items")
      .update({ current_quantity: nextQuantity })
      .eq("id", inventoryItemId)
      .eq("current_quantity", currentQuantity)
      .select("id, current_quantity")
      .maybeSingle();

    if (updateError || !updatedItemData) {
      await (supabase as any)
        .from("inventory_movements")
        .delete()
        .eq("id", (movementData as { id: string }).id);

      return {
        error:
          updateError?.message ??
          "Inventory quantity changed while saving. Please refresh and try again.",
      };
    }

    finalQuantity = Number(updatedItemData.current_quantity || nextQuantity);
  } else if (finalQuantity !== nextQuantity) {
    return {
      error:
        "Inventory quantity changed unexpectedly while recording movement. Please refresh and review stock history.",
    };
  }

  return {
    item: {
      id: item.id,
      itemName: item.item_name,
      previousQuantity: currentQuantity,
      currentQuantity: finalQuantity,
    },
    movement: movementData as { id: string },
  };
}

export async function postStockMovement(args: StockMovementArgs) {
  const useInventoryRpc = shouldUseInventoryRpc();

  if (useInventoryRpc) {
    return postStockMovementWithRpc(args);
  }

  return postStockMovementWithAppLogic(args);
}
