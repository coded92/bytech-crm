"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { uploadFileToStorage } from "@/lib/storage/upload-file";

type CompanySettingsRow = {
  id: string;
};

export async function uploadCompanyLogoAction(formData: FormData) {
  await requireAdmin();
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
    .select("id")
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

  revalidatePath("/settings/company");
  revalidatePath("/dashboard");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");

  return { success: true };
}