"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { postStockMovement } from "@/lib/inventory/stock-integrity";
import { createFieldJobInventoryUsageSchema } from "@/lib/validations/field-job-inventory";

type InventoryItemRow = {
  id: string;
  item_name: string;
  unit_cost: number;
  current_quantity: number;
};

export async function createFieldJobInventoryUsageAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createFieldJobInventoryUsageSchema.safeParse({
    field_job_id: formData.get("field_job_id"),
    inventory_item_id: formData.get("inventory_item_id"),
    quantity: formData.get("quantity"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid inventory usage data",
    };
  }

  const values = parsed.data;

  const { data: inventoryItemData, error: inventoryItemError } = await (supabase as any)
    .from("inventory_items")
    .select("id, item_name, unit_cost, current_quantity")
    .eq("id", values.inventory_item_id)
    .maybeSingle();

  const inventoryItem = inventoryItemData as InventoryItemRow | null;

  if (inventoryItemError || !inventoryItem) {
    return {
      error: inventoryItemError?.message ?? "Inventory item not found",
    };
  }

  const { data: usageData, error: usageError } = await (supabase as any)
    .from("field_job_inventory_usage")
    .insert({
      field_job_id: values.field_job_id,
      inventory_item_id: values.inventory_item_id,
      quantity: values.quantity,
      unit_cost: inventoryItem.unit_cost || 0,
      notes: values.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (usageError) {
    return { error: usageError.message };
  }

  const movementResult = await postStockMovement({
    supabase,
    inventoryItemId: values.inventory_item_id,
    movementType: "stock_out",
    quantity: values.quantity,
    unitCost: inventoryItem.unit_cost || 0,
    fieldJobId: values.field_job_id,
    note: values.notes || "Issued to field job",
    actorId: user.id,
  });

  if ("error" in movementResult) {
    if (usageData?.id) {
      await (supabase as any)
        .from("field_job_inventory_usage")
        .delete()
        .eq("id", usageData.id);
    }

    return { error: movementResult.error };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: values.field_job_id,
    action: "inventory_issued",
    description: `Issued inventory item: ${inventoryItem.item_name}`,
  });

  revalidatePath(`/field-jobs/${values.field_job_id}`);
  revalidatePath(`/inventory/${values.inventory_item_id}`);
  revalidatePath("/inventory");

  return { success: true };
}
