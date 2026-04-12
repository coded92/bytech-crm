"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSupplierSchema } from "@/lib/validations/suppliers";

type SupplierRow = {
  id: string;
};

export async function createSupplierAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createSupplierSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_person: formData.get("contact_person") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid supplier data" };
  }

  const values = parsed.data;

  const { data, error } = await (supabase as any)
    .from("suppliers")
    .insert({
      company_name: values.company_name,
      contact_person: values.contact_person || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      notes: values.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  const supplier = data as SupplierRow | null;

  if (error || !supplier) {
    return { error: error?.message ?? "Failed to create supplier" };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "supplier",
    entity_id: supplier.id,
    action: "created",
    description: `Created supplier: ${values.company_name}`,
  });

  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}


export async function updateSupplierAction(
  supplierId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const companyName = String(formData.get("company_name") || "").trim();
  const contactPerson = String(formData.get("contact_person") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const isActive = String(formData.get("is_active") || "true") === "true";

  if (!companyName) {
    return { error: "Company name is required" };
  }

  const { error } = await (supabase as any)
    .from("suppliers")
    .update({
      company_name: companyName,
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      city: city || null,
      state: state || null,
      address: address || null,
      notes: notes || null,
      is_active: isActive,
    })
    .eq("id", supplierId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "supplier",
    entity_id: supplierId,
    action: "updated",
    description: `Updated supplier: ${companyName}`,
  });

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath(`/suppliers/${supplierId}/edit`);

  return { success: true };
}