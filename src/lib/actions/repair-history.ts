"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createRepairHistorySchema } from "@/lib/validations/repair-history";
import type { Database } from "@/types/database";

type RepairHistoryInsert =
  Database["public"]["Tables"]["asset_repair_history"]["Insert"];

export async function createRepairHistoryAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createRepairHistorySchema.safeParse({
    asset_id: formData.get("asset_id"),
    support_ticket_id: formData.get("support_ticket_id") || undefined,
    repair_title: formData.get("repair_title"),
    repair_type: formData.get("repair_type"),
    repair_status: formData.get("repair_status"),
    technician_id: formData.get("technician_id") || undefined,
    cost: formData.get("cost") || 0,
    repair_date: formData.get("repair_date"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid repair history data",
    };
  }

  const values = parsed.data;

  const payload: RepairHistoryInsert = {
    asset_id: values.asset_id,
    support_ticket_id: values.support_ticket_id || null,
    repair_title: values.repair_title,
    repair_type: values.repair_type,
    repair_status: values.repair_status,
    technician_id: values.technician_id || null,
    cost: values.cost,
    repair_date: values.repair_date,
    notes: values.notes || null,
    created_by: user.id,
  };

  const { error } = await supabase
    .from("asset_repair_history")
    .insert(payload as never);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "asset",
    entity_id: values.asset_id,
    action: "repair_history_created",
    description: `Added repair history: ${values.repair_title}`,
  } as never);

  revalidatePath(`/assets/${values.asset_id}`);

  if (values.support_ticket_id) {
    revalidatePath(`/support/${values.support_ticket_id}`);
  }

  return { success: true };
}