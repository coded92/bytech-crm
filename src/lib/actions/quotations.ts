"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createQuotationSchema,
  quotationStatusSchema,
} from "@/lib/validations/quotation";

type ActionResponse =
  | { success: true }
  | { error: string };

type ParsedItem = {
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
};

function parseQuotationItems(raw: FormDataEntryValue | null): ParsedItem[] {
  if (!raw || typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw) as ParsedItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createQuotationAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const items = parseQuotationItems(formData.get("items"));

  const parsed = createQuotationSchema.safeParse({
    lead_id: formData.get("lead_id") || undefined,
    customer_id: formData.get("customer_id") || undefined,
    company_name: formData.get("company_name"),
    contact_person: formData.get("contact_person") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    valid_until: formData.get("valid_until") || undefined,
    discount: formData.get("discount") || 0,
    tax: formData.get("tax") || 0,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid quotation data",
    };
  }

  const values = parsed.data;

  const subtotal = values.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const total = subtotal - values.discount + values.tax;

  const quotationResult = await (supabase as any)
    .from("quotations")
    .insert({
      lead_id: values.lead_id || null,
      customer_id: values.customer_id || null,
      company_name: values.company_name,
      contact_person: values.contact_person || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      valid_until: values.valid_until || null,
      discount: values.discount,
      tax: values.tax,
      subtotal,
      total,
      notes: values.notes || null,
      created_by: user.id,
      status: "draft",
    })
    .select("id, lead_id")
    .single();

  const quotation = quotationResult.data as
    | { id: string; lead_id: string | null }
    | null;

  if (quotationResult.error || !quotation) {
    return {
      error: String(
        quotationResult.error?.message || "Failed to create quotation"
      ),
    };
  }

  const quotationItems = values.items.map((item) => ({
    quotation_id: quotation.id,
    item_name: item.item_name,
    description: item.description || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const itemsResult = await (supabase as any)
    .from("quotation_items")
    .insert(quotationItems);

  if (itemsResult.error) {
    return {
      error: String(itemsResult.error.message || itemsResult.error),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "quotation",
    entity_id: quotation.id,
    action: "created",
    description: `Created quotation for ${values.company_name}`,
  });

  if (quotation.lead_id) {
    await (supabase as any).from("lead_activities").insert({
      lead_id: quotation.lead_id,
      activity_type: "quotation_created",
      actor_id: user.id,
      new_value: {
        quotation_id: quotation.id,
      },
    });
  }

  revalidatePath("/quotations");
  if (values.lead_id) revalidatePath(`/leads/${values.lead_id}`);
  if (values.customer_id) revalidatePath(`/customers/${values.customer_id}`);

  redirect(`/quotations/${quotation.id}`);
}

export async function updateQuotationStatusAction(
  quotationId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = quotationStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Invalid quotation status" };
  }

  const updateResult = await (supabase as any)
    .from("quotations")
    .update({
      status: parsed.data.status,
    })
    .eq("id", quotationId);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "quotation",
    entity_id: quotationId,
    action: "status_updated",
    description: `Updated quotation status to ${parsed.data.status}`,
  });

  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/quotations");

  return { success: true };
}