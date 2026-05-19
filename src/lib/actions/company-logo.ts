"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/require-permission";
import { logSecurityEvent } from "@/lib/security/events";
import { createClient } from "@/lib/supabase/server";
import { uploadFileToStorage } from "@/lib/storage/upload-file";

type CompanySettingsRow = {
  id: string;
  logo_url: string | null;
};

export async function uploadCompanyLogoAction(formData: FormData) {
  const profile = await requirePermission("settings", "admin");
  const supabase = await createClient();

  const fileEntry = formData.get("logo");

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { error: "Please choose a logo file" };
  }

  const uploadResult = await uploadFileToStorage({
    bucket: "branding",
    file: fileEntry,
    folder: "company-logo",
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { data: settingsData } = await (supabase as any)
    .from("company_settings")
    .select("id, logo_url")
    .limit(1)
    .maybeSingle();

  const settings = settingsData as CompanySettingsRow | null;

  if (!settings?.id) {
    return { error: "Company settings record not found" };
  }

  const { data: publicData } = supabase.storage
    .from("branding")
    .getPublicUrl(uploadResult.filePath);

  const { error } = await (supabase as any)
    .from("company_settings")
    .update({
      logo_url: publicData.publicUrl,
    })
    .eq("id", settings.id);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "company_settings",
    entity_id: settings.id,
    action: "logo_uploaded",
    description: "Updated company logo for document branding",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "document_branding_settings_updated",
    metadata: {
      scope: "company_logo",
      storage_bucket: "branding",
      storage_path: uploadResult.filePath,
    },
  });

  revalidatePath("/settings/company");
  revalidatePath("/settings/documents-branding");
  revalidatePath("/dashboard");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");
  revalidatePath("/support");
  revalidatePath("/customers");

  return { success: true };
}

export async function deleteCompanyLogoAction() {
  const profile = await requirePermission("settings", "admin");
  const supabase = await createClient();

  const { data: settingsData } = await (supabase as any)
    .from("company_settings")
    .select("id, logo_url")
    .limit(1)
    .maybeSingle();

  const settings = settingsData as CompanySettingsRow | null;

  if (!settings?.id) {
    return { error: "Company settings record not found" };
  }

  const { error } = await (supabase as any)
    .from("company_settings")
    .update({
      logo_url: null,
    })
    .eq("id", settings.id);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "company_settings",
    entity_id: settings.id,
    action: "logo_removed",
    description: "Removed company logo from document branding",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "document_branding_settings_updated",
    metadata: {
      scope: "company_logo_removed",
    },
  });

  revalidatePath("/settings/company");
  revalidatePath("/settings/documents-branding");
  revalidatePath("/dashboard");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");
  revalidatePath("/support");
  revalidatePath("/customers");

  return { success: true };
}
