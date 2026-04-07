"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createInvoiceSchema,
  recordPaymentSchema,
} from "@/lib/validations/payment";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function createInvoiceAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createInvoiceSchema.safeParse({
    customer_id: formData.get("customer_id"),
    quotation_id: formData.get("quotation_id") || undefined,
    invoice_type: formData.get("invoice_type"),
    amount: formData.get("amount"),
    due_date: formData.get("due_date"),
    billing_period_start: formData.get("billing_period_start") || undefined,
    billing_period_end: formData.get("billing_period_end") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid invoice data",
    };
  }

  const values = parsed.data;

  const invoiceResult = await (supabase as any)
    .from("payment_invoices")
    .insert({
      customer_id: values.customer_id,
      quotation_id: values.quotation_id || null,
      invoice_type: values.invoice_type,
      amount: values.amount,
      due_date: values.due_date,
      billing_period_start: values.billing_period_start || null,
      billing_period_end: values.billing_period_end || null,
      reference: values.reference || null,
      notes: values.notes || null,
      created_by: user.id,
      status: "pending",
      amount_paid: 0,
    })
    .select("id")
    .single();

  const invoice = invoiceResult.data as { id: string } | null;

  if (invoiceResult.error || !invoice) {
    return {
      error: String(invoiceResult.error?.message || "Failed to create invoice"),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "invoice",
    entity_id: invoice.id,
    action: "created",
    description: `Created ${values.invoice_type} invoice`,
  });

  revalidatePath("/payments/invoices");
  revalidatePath(`/customers/${values.customer_id}`);

  redirect(`/payments/invoices/${invoice.id}`);
}

export async function recordPaymentAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = recordPaymentSchema.safeParse({
    invoice_id: formData.get("invoice_id"),
    customer_id: formData.get("customer_id"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    payment_reference: formData.get("payment_reference") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid payment data",
    };
  }

  const values = parsed.data;

  const paymentResult = await (supabase as any)
    .from("payment_transactions")
    .insert({
      invoice_id: values.invoice_id,
      customer_id: values.customer_id,
      amount: values.amount,
      payment_method: values.payment_method,
      payment_reference: values.payment_reference || null,
      notes: values.notes || null,
      received_by: user.id,
    })
    .select("id")
    .single();

  const payment = paymentResult.data as { id: string } | null;

  if (paymentResult.error || !payment) {
    return {
      error: String(paymentResult.error?.message || "Failed to record payment"),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "payment",
    entity_id: payment.id,
    action: "received",
    description: `Recorded payment of ${values.amount}`,
  });

  revalidatePath(`/payments/invoices/${values.invoice_id}`);
  revalidatePath("/payments/invoices");
  revalidatePath(`/customers/${values.customer_id}`);

  return { success: true };
}