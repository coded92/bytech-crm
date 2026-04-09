"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { updateCompanySettingsSchema } from "@/lib/validations/company-settings";

type CompanySettingsRow = {
  id: string;
};

export async function updateCompanySettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const parsed = updateCompanySettingsSchema.safeParse({
    company_name: formData.get("company_name"),
    brand_name: formData.get("brand_name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    country: formData.get("country") || undefined,
    logo_url: formData.get("logo_url") || undefined,
    currency_symbol: formData.get("currency_symbol"),
    document_footer: formData.get("document_footer") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid settings data",
    };
  }

  const values = parsed.data;

  const { data: existingData } = await (supabase as any)
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const existing = existingData as CompanySettingsRow | null;

  const payload = {
    company_name: values.company_name,
    brand_name: values.brand_name || null,
    email: values.email || null,
    phone: values.phone || null,
    website: values.website || null,
    address: values.address || null,
    city: values.city || null,
    state: values.state || null,
    country: values.country || null,
    logo_url: values.logo_url || null,
    currency_symbol: values.currency_symbol,
    document_footer: values.document_footer || null,
  };

  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("company_settings")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await (supabase as any)
      .from("company_settings")
      .insert(payload);

    if (error) {
      return { error: error.message };
    }
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: admin.id,
    entity_type: "company_settings",
    entity_id: existing?.id || admin.id,
    action: "updated",
    description: "Updated company settings and document branding",
  });

  revalidatePath("/settings/company");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");
  revalidatePath("/support");
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  return { success: true };
}