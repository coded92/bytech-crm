"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  convertLeadToCustomerSchema,
  updateCustomerStatusSchema,
} from "@/lib/validations/customer";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function convertLeadToCustomerAction(
  leadId: string,
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = convertLeadToCustomerSchema.safeParse({
    plan_type: formData.get("plan_type"),
    setup_fee: formData.get("setup_fee") || 0,
    subscription_amount: formData.get("subscription_amount") || 0,
    billing_cycle: formData.get("billing_cycle") || "monthly",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid conversion data",
    };
  }

  const values = parsed.data;

  const rpcResult = await (supabase as any).rpc("convert_lead_to_customer", {
    p_lead_id: leadId,
    p_plan_type: values.plan_type,
    p_setup_fee: values.setup_fee,
    p_subscription_amount: values.subscription_amount,
    p_billing_cycle: values.billing_cycle,
  });

  const data = rpcResult.data as string | null;
  const error = rpcResult.error as { message?: string } | null;

  if (error || !data) {
    return { error: error?.message ?? "Failed to convert lead" };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/customers");
  revalidatePath(`/customers/${data}`);

  redirect(`/customers/${data}`);
}

export async function createCustomerAction(
  formData: FormData
): Promise<ActionResponse | never> {
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
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const businessType = String(formData.get("business_type") || "").trim();
  const planType = String(formData.get("plan_type") || "").trim();
  const billingCycle = String(formData.get("billing_cycle") || "").trim();
  const subscriptionAmount = Number(formData.get("subscription_amount") || 0);
  const setupFee = Number(formData.get("setup_fee") || 0);
  const status = String(formData.get("status") || "active").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!companyName) {
    return { error: "Company name is required" };
  }

  const insertResult = await (supabase as any)
    .from("customers")
    .insert({
      company_name: companyName,
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      business_type: businessType || null,
      plan_type: planType || null,
      billing_cycle: billingCycle || null,
      subscription_amount: subscriptionAmount || 0,
      setup_fee: setupFee || 0,
      status: status || "active",
      notes: notes || null,
      created_by: user.id,
    })
    .select("id, company_name")
    .single();

  const customer = insertResult.data as
    | { id: string; company_name: string }
    | null;

  if (insertResult.error || !customer) {
    return {
      error: insertResult.error?.message ?? "Failed to create customer",
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "customer",
    entity_id: customer.id,
    action: "created",
    description: `Created customer: ${customer.company_name}`,
  });

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerStatusAction(
  customerId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateCustomerStatusSchema.safeParse({
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid customer update data",
    };
  }

  const values = parsed.data;

  const updateResult = await (supabase as any)
    .from("customers")
    .update({
      status: values.status,
      notes: values.notes || null,
    })
    .eq("id", customerId);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "customer",
    entity_id: customerId,
    action: "updated",
    description: `Updated customer status to ${values.status}`,
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");

  return { success: true };
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData
): Promise<ActionResponse | never> {
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
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const businessType = String(formData.get("business_type") || "").trim();
  const planType = String(formData.get("plan_type") || "").trim();
  const billingCycle = String(formData.get("billing_cycle") || "").trim();
  const subscriptionAmount = Number(formData.get("subscription_amount") || 0);
  const setupFee = Number(formData.get("setup_fee") || 0);
  const status = String(formData.get("status") || "active").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!companyName) {
    return { error: "Company name is required" };
  }

  const updateResult = await (supabase as any)
    .from("customers")
    .update({
      company_name: companyName,
      contact_person: contactPerson || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      business_type: businessType || null,
      plan_type: planType || null,
      billing_cycle: billingCycle || null,
      subscription_amount: subscriptionAmount || 0,
      setup_fee: setupFee || 0,
      status: status || "active",
      notes: notes || null,
    })
    .eq("id", customerId);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "customer",
    entity_id: customerId,
    action: "updated",
    description: `Updated customer: ${companyName}`,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/edit`);

  redirect(`/customers/${customerId}`);
}