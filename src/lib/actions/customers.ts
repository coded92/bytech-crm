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