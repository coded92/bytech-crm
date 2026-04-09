"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAssetSchema, updateAssetSchema } from "@/lib/validations/asset";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];

type AssetInsertResult = {
  id: string;
};

export async function createAssetAction(formData: FormData) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const parsed = createAssetSchema.safeParse({
    device_type: formData.get("device_type"),
    serial_number: formData.get("serial_number") || undefined,
    customer_id: formData.get("customer_id") || undefined,
    branch_id: formData.get("branch_id") || undefined,
    deployment_id: formData.get("deployment_id") || undefined,
    condition: formData.get("condition"),
    status: formData.get("status"),
    purchase_date: formData.get("purchase_date") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid asset data" };
  }

  const values = parsed.data;

  const payload: AssetInsert = {
    device_type: values.device_type,
    serial_number: values.serial_number || null,
    customer_id: values.customer_id || null,
    branch_id: values.branch_id || null,
    deployment_id: values.deployment_id || null,
    condition: values.condition,
    status: values.status,
    purchase_date: values.purchase_date || null,
    notes: values.notes || null,
    created_by: profile.id,
  };

  const { data: assetData, error } = await supabase
    .from("assets")
    .insert(payload as never)
    .select("id")
    .single();

  if (error || !assetData) {
    return { error: error?.message ?? "Failed to create asset" };
  }

  const asset = assetData as AssetInsertResult;

  redirect(`/assets/${asset.id}`);
}

export async function updateAssetAction(assetId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const parsed = updateAssetSchema.safeParse({
    device_type: formData.get("device_type"),
    serial_number: formData.get("serial_number") || undefined,
    customer_id: formData.get("customer_id") || undefined,
    branch_id: formData.get("branch_id") || undefined,
    deployment_id: formData.get("deployment_id") || undefined,
    condition: formData.get("condition"),
    status: formData.get("status"),
    purchase_date: formData.get("purchase_date") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid asset data" };
  }

  const values = parsed.data;

  const updatePayload = {
    device_type: values.device_type,
    serial_number: values.serial_number || null,
    customer_id: values.customer_id || null,
    branch_id: values.branch_id || null,
    deployment_id: values.deployment_id || null,
    condition: values.condition,
    status: values.status,
    purchase_date: values.purchase_date || null,
    notes: values.notes || null,
  };

  const { error } = await (supabase as any)
    .from("assets")
    .update(updatePayload)
    .eq("id", assetId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath(`/assets/${assetId}/edit`);

  redirect(`/assets/${assetId}`);
}