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

export async function updateInvoiceAction(
  invoiceId: string,
  formData: FormData
): Promise<{ success: true } | { error: string } | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const customerId = String(formData.get("customer_id") || "").trim();
  const quotationId = String(formData.get("quotation_id") || "").trim();
  const invoiceType = String(formData.get("invoice_type") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const dueDate = String(formData.get("due_date") || "").trim();
  const status = String(formData.get("status") || "pending").trim();
  const reference = String(formData.get("reference") || "").trim();
  const billingPeriodStart = String(formData.get("billing_period_start") || "").trim();
  const billingPeriodEnd = String(formData.get("billing_period_end") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!customerId) {
    return { error: "Customer is required" };
  }

  if (!invoiceType) {
    return { error: "Invoice type is required" };
  }

  if (!amount || amount < 0) {
    return { error: "Enter a valid amount" };
  }

  if (!dueDate) {
    return { error: "Due date is required" };
  }

  const { data: existingInvoice, error: existingError } = await (supabase as any)
    .from("payment_invoices")
    .select("amount_paid")
    .eq("id", invoiceId)
    .single();

  if (existingError || !existingInvoice) {
    return { error: existingError?.message ?? "Invoice not found" };
  }

  const amountPaid = Number(existingInvoice.amount_paid || 0);
  const balance = Math.max(amount - amountPaid, 0);

  const { error } = await (supabase as any)
    .from("payment_invoices")
    .update({
      customer_id: customerId,
      quotation_id: quotationId || null,
      invoice_type: invoiceType,
      amount,
      balance,
      due_date: dueDate,
      status,
      reference: reference || null,
      billing_period_start: billingPeriodStart || null,
      billing_period_end: billingPeriodEnd || null,
      notes: notes || null,
    })
    .eq("id", invoiceId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "invoice",
    entity_id: invoiceId,
    action: "updated",
    description: "Updated invoice record",
  });

  revalidatePath("/payments");
  revalidatePath("/payments/invoices");
  revalidatePath(`/payments/invoices/${invoiceId}`);
  revalidatePath(`/payments/invoices/${invoiceId}/edit`);

  redirect(`/payments/invoices/${invoiceId}`);
}

export async function updatePaymentAction(
  paymentId: string,
  formData: FormData
): Promise<{ success: true } | { error: string } | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const paymentMethod = String(formData.get("payment_method") || "").trim();
  const paymentReference = String(formData.get("payment_reference") || "").trim();
  const paidAt = String(formData.get("paid_at") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!paymentMethod) {
    return { error: "Payment method is required" };
  }

  if (!paidAt) {
    return { error: "Payment date is required" };
  }

  const { data: existingPayment, error: existingPaymentError } = await (supabase as any)
    .from("payment_transactions")
    .select("id, invoice_id, customer_id, amount")
    .eq("id", paymentId)
    .single();

  if (existingPaymentError || !existingPayment) {
    return { error: existingPaymentError?.message ?? "Payment not found" };
  }

  const { error } = await (supabase as any)
    .from("payment_transactions")
    .update({
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      paid_at: new Date(paidAt).toISOString(),
      notes: notes || null,
    })
    .eq("id", paymentId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "payment_transaction",
    entity_id: paymentId,
    action: "updated",
    description: `Updated payment record`,
  });

  revalidatePath("/payments");
  revalidatePath(`/payments/transactions/${paymentId}`);
  revalidatePath(`/payments/transactions/${paymentId}/edit`);
  revalidatePath(`/payments/invoices/${existingPayment.invoice_id}`);

  redirect(`/payments/transactions/${paymentId}`);
}