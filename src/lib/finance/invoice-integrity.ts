import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type InvoiceRow = {
  id: string;
  customer_id: string;
  amount: number | string | null;
  amount_paid: number | string | null;
  status: string | null;
};

type PaymentInsert = {
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  received_by: string;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getInvoiceStatus(amount: number, amountPaid: number) {
  if (amountPaid <= 0) return "pending";
  if (amountPaid < amount) return "partial";
  return "paid";
}

export async function createPaymentAndSyncInvoice(args: {
  supabase: SupabaseServerClient;
  payment: PaymentInsert;
}) {
  const { supabase, payment } = args;

  const { data: invoiceData, error: invoiceError } = await (supabase as any)
    .from("payment_invoices")
    .select("id, customer_id, amount, amount_paid, status")
    .eq("id", payment.invoice_id)
    .maybeSingle();

  const invoice = invoiceData as InvoiceRow | null;

  if (invoiceError || !invoice) {
    return { error: invoiceError?.message ?? "Invoice not found" };
  }

  if (invoice.customer_id !== payment.customer_id) {
    return { error: "Payment customer does not match invoice customer." };
  }

  const amount = roundMoney(Number(invoice.amount || 0));
  const currentPaid = roundMoney(Number(invoice.amount_paid || 0));
  const paymentAmount = roundMoney(Number(payment.amount || 0));
  const nextPaid = roundMoney(currentPaid + paymentAmount);

  if (paymentAmount <= 0) {
    return { error: "Payment amount must be greater than zero." };
  }

  if (nextPaid > amount) {
    return { error: "Payment exceeds the outstanding invoice balance." };
  }

  const nextBalance = roundMoney(amount - nextPaid);
  const nextStatus = getInvoiceStatus(amount, nextPaid);

  const { data: paymentData, error: paymentError } = await (supabase as any)
    .from("payment_transactions")
    .insert(payment)
    .select("id")
    .single();

  const createdPayment = paymentData as { id: string } | null;

  if (paymentError || !createdPayment) {
    return { error: paymentError?.message ?? "Failed to record payment" };
  }

  const { data: updatedInvoiceData, error: updateError } = await (supabase as any)
    .from("payment_invoices")
    .update({
      amount_paid: nextPaid,
      balance: nextBalance,
      status: nextStatus,
      paid_date: nextStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", payment.invoice_id)
    .eq("amount_paid", currentPaid)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedInvoiceData) {
    await (supabase as any)
      .from("payment_transactions")
      .delete()
      .eq("id", createdPayment.id);

    return {
      error:
        updateError?.message ??
        "Invoice was updated by another user. Please refresh and try again.",
    };
  }

  return {
    payment: createdPayment,
    invoice: {
      amount,
      amountPaid: nextPaid,
      balance: nextBalance,
      status: nextStatus,
    },
  };
}

export function getInvoiceTotalsForAmount(amount: number, amountPaid: number) {
  const safeAmount = roundMoney(amount);
  const safePaid = roundMoney(amountPaid);

  if (safePaid > safeAmount) {
    return { error: "Invoice amount cannot be lower than amount already paid." };
  }

  return {
    amount: safeAmount,
    amountPaid: safePaid,
    balance: roundMoney(safeAmount - safePaid),
    status: getInvoiceStatus(safeAmount, safePaid),
  };
}
