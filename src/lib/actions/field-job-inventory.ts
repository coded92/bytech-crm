"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createFieldJobInventoryUsageSchema } from "@/lib/validations/field-job-inventory";

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

  // Phase 4B: field-job inventory usage is now posted through the database RPC.
  // The RPC is the atomic boundary: it inserts the usage row, inserts one
  // stock-out movement, lets the inventory movement trigger update stock,
  // verifies the expected quantity, and writes the field-job activity log.
  const { error } = await (supabase as any).rpc("issue_field_job_inventory", {
    p_field_job_id: values.field_job_id,
    p_inventory_item_id: values.inventory_item_id,
    p_quantity: values.quantity,
    p_notes: values.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/field-jobs/${values.field_job_id}`);
  revalidatePath(`/inventory/${values.inventory_item_id}`);
  revalidatePath("/inventory");

  return { success: true };
}
