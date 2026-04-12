import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentEditForm } from "@/components/payments/payment-edit-form";

type EditPaymentPageProps = {
  params: Promise<{ id: string }>;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: "cash" | "transfer" | "card" | "pos" | "other" | null;
  payment_reference: string | null;
  received_by: string | null;
  paid_at: string;
  notes: string | null;
};

export default async function EditPaymentPage({
  params,
}: EditPaymentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payment_transactions")
    .select(
      "id, invoice_id, customer_id, amount, payment_method, payment_reference, received_by, paid_at, notes"
    )
    .eq("id", id)
    .single();

  if (!payment) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Payment
        </h2>
        <p className="text-slate-600">
          Update payment details without changing invoice totals.
        </p>
      </div>

      <PaymentEditForm payment={payment as PaymentRow} />
    </div>
  );
}