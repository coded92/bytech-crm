import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentSignatureBlock,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

type PrintReceiptPageProps = {
  params: Promise<{ id: string }>;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  invoice_id: string | null;
  payment_transaction_id: string | null;
  amount_received: number;
  payment_method: string | null;
  payment_date: string;
  received_by: string | null;
  notes: string | null;
  customer?: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice?: {
    invoice_number: string | null;
    amount: number | null;
    amount_paid: number | null;
    balance: number | null;
    status: string | null;
  } | null;
};

type PaymentTransactionRow = {
  payment_reference: string | null;
};

type ReceiverRow = {
  full_name: string | null;
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
      invoice:payment_invoices(invoice_number, amount, amount_paid, balance, status)
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
  const [{ data: transactionData }, { data: receiverData }] = await Promise.all([
    receipt.payment_transaction_id
      ? supabase
          .from("payment_transactions")
          .select("payment_reference")
          .eq("id", receipt.payment_transaction_id)
          .maybeSingle()
      : { data: null },
    receipt.received_by
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", receipt.received_by)
          .maybeSingle()
      : { data: null },
  ]);

  const transaction = transactionData as PaymentTransactionRow | null;
  const receiver = receiverData as ReceiverRow | null;
  const paymentReference =
    transaction?.payment_reference || receipt.receipt_number;

  return (
    <DocumentShell
      title="Receipt"
      documentNumber={receipt.receipt_number}
    >
      <div className="space-y-8">
        <section className="document-avoid-break grid gap-8 md:grid-cols-[1fr_0.9fr] print:grid-cols-[1fr_0.9fr]">
          <div className="border-l-4 border-emerald-700 pl-5">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Amount Received
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-950">
              {formatCurrency(receipt.amount_received)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Received on {formatDateTime(receipt.payment_date)}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end print:items-end">
            <DocumentStatusStamp status="Received" tone="success" />
            <p className="text-right text-sm text-slate-600">
              Official payment confirmation
            </p>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Received From
            </h3>
            <div className="mt-4 space-y-3">
              <p className="text-base font-semibold text-slate-950">
                {receipt.customer?.company_name || "-"}
              </p>
              <DocumentInfoRow
                label="Contact"
                value={receipt.customer?.contact_person || "-"}
              />
              <DocumentInfoRow label="Email" value={receipt.customer?.email || "-"} />
              <DocumentInfoRow label="Phone" value={receipt.customer?.phone || "-"} />
            </div>
          </div>

          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Receipt Details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
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
                value={receipt.payment_method || "-"}
              />
              <DocumentInfoRow
                label="Payment Date"
                value={formatDateTime(receipt.payment_date)}
              />
              <DocumentInfoRow
                label="Payment Ref"
                value={paymentReference}
              />
              <DocumentInfoRow
                label="Received By"
                value={receiver?.full_name || "-"}
              />
            </div>
          </div>
        </section>

        {receipt.invoice ? (
          <DocumentSection title="Linked Invoice Summary">
            <DocumentTable>
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Invoice Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                    {receipt.invoice.invoice_number || "-"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700">
                    {formatCurrency(receipt.invoice.amount || 0)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700">
                    {formatCurrency(receipt.invoice.amount_paid || 0)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                    {formatCurrency(receipt.invoice.balance || 0)}
                  </td>
                </tr>
              </tbody>
            </DocumentTable>
          </DocumentSection>
        ) : null}

        <DocumentTotals
          rows={[
            {
              label: "Amount Received",
              value: formatCurrency(receipt.amount_received),
              strong: true,
            },
          ]}
        />

        <DocumentSection title="Receipt Notes">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {receipt.notes || "-"}
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Received by"
          rightLabel="Customer acknowledgment"
        />
      </div>
    </DocumentShell>
  );
}
