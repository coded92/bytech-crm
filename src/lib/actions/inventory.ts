"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createInventoryItemSchema,
  createInventoryMovementSchema,
} from "@/lib/validations/inventory";

type CreatedItemRow = {
  id: string;
};

export async function createInventoryItemAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createInventoryItemSchema.safeParse({
    item_name: formData.get("item_name"),
    category: formData.get("category"),
    sku: formData.get("sku") || undefined,
    unit: formData.get("unit"),
    current_quantity: formData.get("current_quantity"),
    minimum_quantity: formData.get("minimum_quantity"),
    unit_cost: formData.get("unit_cost"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid inventory item data",
    };
  }

  const values = parsed.data;

  const { data, error } = await (supabase as any)
    .from("inventory_items")
    .insert({
      item_name: values.item_name,
      category: values.category,
      sku: values.sku || null,
      unit: values.unit,
      current_quantity: values.current_quantity,
      minimum_quantity: values.minimum_quantity,
      unit_cost: values.unit_cost,
      notes: values.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  const item = data as CreatedItemRow | null;

  if (error || !item) {
    return { error: error?.message ?? "Failed to create inventory item" };
  }

  if (values.current_quantity > 0) {
    await (supabase as any).from("inventory_movements").insert({
      inventory_item_id: item.id,
      movement_type: "stock_in",
      quantity: values.current_quantity,
      unit_cost: values.unit_cost,
      note: "Opening stock",
      created_by: user.id,
    });
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "inventory_item",
    entity_id: item.id,
    action: "created",
    description: `Created inventory item: ${values.item_name}`,
  });

  revalidatePath("/inventory");
  redirect(`/inventory/${item.id}`);
}

export async function createInventoryMovementAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createInventoryMovementSchema.safeParse({
    inventory_item_id: formData.get("inventory_item_id"),
    movement_type: formData.get("movement_type"),
    quantity: formData.get("quantity"),
    unit_cost: formData.get("unit_cost") || undefined,
    field_job_id: formData.get("field_job_id") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid stock movement",
    };
  }

  const values = parsed.data;

  const { error } = await (supabase as any)
    .from("inventory_movements")
    .insert({
      inventory_item_id: values.inventory_item_id,
      movement_type: values.movement_type,
      quantity: values.quantity,
      unit_cost: values.unit_cost ?? null,
      field_job_id: values.field_job_id || null,
      note: values.note || null,
      created_by: user.id,
    });

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "inventory_item",
    entity_id: values.inventory_item_id,
    action: "movement_created",
    description: `Added inventory movement: ${values.movement_type}`,
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${values.inventory_item_id}`);

  return { success: true };
}

export async function updateInventoryItemAction(
  itemId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const itemName = String(formData.get("item_name") || "").trim();
  const itemCode = String(formData.get("item_code") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const sku = String(formData.get("sku") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const minimumQuantity = Number(formData.get("minimum_quantity") || 0);
  const unitCost = Number(formData.get("unit_cost") || 0);
  const notes = String(formData.get("notes") || "").trim();

  if (!itemName) {
    return { error: "Item name is required" };
  }

  if (!itemCode) {
    return { error: "Item code is required" };
  }

  if (!unit) {
    return { error: "Unit is required" };
  }

  const { error } = await (supabase as any)
    .from("inventory_items")
    .update({
      item_name: itemName,
      item_code: itemCode,
      category,
      sku: sku || null,
      unit,
      minimum_quantity: minimumQuantity,
      unit_cost: unitCost,
      notes: notes || null,
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "inventory_item",
    entity_id: itemId,
    action: "updated",
    description: `Updated inventory item: ${itemName}`,
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${itemId}`);
  revalidatePath(`/inventory/${itemId}/edit`);

  return { success: true };
}

export async function adjustInventoryStockAction(
  itemId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const movementType = String(formData.get("movement_type") || "").trim();
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unit_cost") || 0);
  const note = String(formData.get("note") || "").trim();

  if (!movementType) {
    return { error: "Adjustment type is required" };
  }

  if (!quantity || quantity <= 0) {
    return { error: "Quantity must be greater than zero" };
  }

  const { data: item, error: itemError } = await (supabase as any)
    .from("inventory_items")
    .select("item_name, current_quantity")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    return { error: itemError?.message ?? "Inventory item not found" };
  }

  const currentQuantity = Number(item.current_quantity || 0);

  let nextQuantity = currentQuantity;

  if (movementType === "stock_in") {
    nextQuantity = currentQuantity + quantity;
  } else if (movementType === "stock_out") {
    nextQuantity = currentQuantity - quantity;
  } else if (movementType === "adjustment") {
    nextQuantity = currentQuantity + quantity;
  }

  if (nextQuantity < 0) {
    return { error: "Stock cannot go below zero" };
  }

  const { error: movementError } = await (supabase as any)
    .from("inventory_movements")
    .insert({
      inventory_item_id: itemId,
      movement_type: movementType,
      quantity,
      unit_cost: unitCost || null,
      note: note || null,
      created_by: user.id,
    });

  if (movementError) {
    return { error: movementError.message };
  }

  const { error: updateError } = await (supabase as any)
    .from("inventory_items")
    .update({
      current_quantity: nextQuantity,
    })
    .eq("id", itemId);

  if (updateError) {
    return { error: updateError.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "inventory_item",
    entity_id: itemId,
    action: "stock_adjusted",
    description: `Adjusted stock for ${item.item_name}`,
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${itemId}`);
  revalidatePath(`/inventory/${itemId}/edit`);

  return { success: true };
}