import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type PrintReceiptPageProps = {
  params: Promise<{ id: string }>;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  amount_received: number;
  payment_method: string | null;
  payment_date: string;
  notes: string | null;
  customer?: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice?: {
    invoice_number: string | null;
  } | null;
};

export default async function PrintReceiptPage({
  params,
}: PrintReceiptPageProps) {
  const { id } = await params;

  if (!id || id === "undefined") {
    notFound();
  }

  const supabase = await createClient();

  const { data: receiptData, error } = await supabase
    .from("receipts")
    .select(`
      *,
      customer:customers(company_name, contact_person, email, phone),
      invoice:payment_invoices(invoice_number)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load receipt print page: {error.message}
      </div>
    );
  }

  if (!receiptData) {
    notFound();
  }

  const receipt = receiptData as ReceiptRow;

  return (
    <DocumentShell
      title="Receipt"
      documentNumber={receipt.receipt_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Received From
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Company"
                value={receipt.customer?.company_name}
              />
              <DocumentInfoRow
                label="Contact Person"
                value={receipt.customer?.contact_person}
              />
              <DocumentInfoRow label="Email" value={receipt.customer?.email} />
              <DocumentInfoRow label="Phone" value={receipt.customer?.phone} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Receipt Details
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Receipt Number"
                value={receipt.receipt_number}
              />
              <DocumentInfoRow
                label="Invoice Number"
                value={receipt.invoice?.invoice_number ?? "-"}
              />
              <DocumentInfoRow
                label="Payment Method"
                value={receipt.payment_method}
              />
              <DocumentInfoRow
                label="Payment Date"
                value={formatDateTime(receipt.payment_date)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Amount Received
          </p>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {formatCurrency(receipt.amount_received)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {receipt.notes || "-"}
          </p>
        </div>
      </div>
    </DocumentShell>
  );
}