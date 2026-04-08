import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type PrintInvoicePageProps = {
  params: Promise<{ id: string }>;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  created_at: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  notes: string | null;
  customer?: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  quotation?: {
    quote_number: string | null;
  } | null;
};

export default async function PrintInvoicePage({
  params,
}: PrintInvoicePageProps) {
  const { id } = await params;

  if (!id || id === "undefined") {
    notFound();
  }

  const supabase = await createClient();

  const { data: invoiceData, error } = await supabase
    .from("payment_invoices")
    .select(`
      *,
      customer:customers(company_name, contact_person, email, phone, address),
      quotation:quotations(quote_number)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load invoice print page: {error.message}
      </div>
    );
  }

  if (!invoiceData) {
    notFound();
  }

  const invoice = invoiceData as InvoiceRow;

  return (
    <DocumentShell
      title="Invoice"
      documentNumber={invoice.invoice_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Bill To</h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Company"
                value={invoice.customer?.company_name}
              />
              <DocumentInfoRow
                label="Contact Person"
                value={invoice.customer?.contact_person}
              />
              <DocumentInfoRow label="Email" value={invoice.customer?.email} />
              <DocumentInfoRow label="Phone" value={invoice.customer?.phone} />
              <DocumentInfoRow
                label="Address"
                value={invoice.customer?.address}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Invoice Details
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Invoice Number"
                value={invoice.invoice_number}
              />
              <DocumentInfoRow
                label="Invoice Type"
                value={invoice.invoice_type.replaceAll("_", " ")}
              />
              <DocumentInfoRow
                label="Quotation Ref"
                value={invoice.quotation?.quote_number ?? "-"}
              />
              <DocumentInfoRow label="Status" value={invoice.status} />
              <DocumentInfoRow
                label="Due Date"
                value={formatDate(invoice.due_date)}
              />
              <DocumentInfoRow
                label="Created At"
                value={formatDateTime(invoice.created_at)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Balance
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="px-4 py-4 text-sm text-slate-900 capitalize">
                  {invoice.invoice_type.replaceAll("_", " ")} invoice
                </td>
                <td className="px-4 py-4 text-right text-sm text-slate-900">
                  {formatCurrency(invoice.amount)}
                </td>
                <td className="px-4 py-4 text-right text-sm text-slate-900">
                  {formatCurrency(invoice.amount_paid)}
                </td>
                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                  {formatCurrency(invoice.balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-sm space-y-3 rounded-xl border border-slate-200 p-5">
          <SummaryRow
            label="Invoice Amount"
            value={formatCurrency(invoice.amount)}
          />
          <SummaryRow
            label="Amount Paid"
            value={formatCurrency(invoice.amount_paid)}
          />
          <SummaryRow
            label="Outstanding Balance"
            value={formatCurrency(invoice.balance)}
            strong
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {invoice.notes || "-"}
          </p>
        </div>
      </div>
    </DocumentShell>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={strong ? "text-lg font-bold text-slate-900" : "text-slate-900"}>
        {value}
      </span>
    </div>
  );
}