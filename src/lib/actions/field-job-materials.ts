"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createFieldJobMaterialSchema } from "@/lib/validations/field-job-materials";

export async function createFieldJobMaterialAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createFieldJobMaterialSchema.safeParse({
    field_job_id: formData.get("field_job_id"),
    item_name: formData.get("item_name"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit") || undefined,
    unit_cost: formData.get("unit_cost"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid material data",
    };
  }

  const values = parsed.data;

  const { error } = await (supabase as any)
    .from("field_job_materials")
    .insert({
      field_job_id: values.field_job_id,
      item_name: values.item_name,
      quantity: values.quantity,
      unit: values.unit || null,
      unit_cost: values.unit_cost,
      notes: values.notes || null,
      created_by: user.id,
    });

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: values.field_job_id,
    action: "material_added",
    description: `Added material: ${values.item_name}`,
  });

  revalidatePath(`/field-jobs/${values.field_job_id}`);
  return { success: true };
}