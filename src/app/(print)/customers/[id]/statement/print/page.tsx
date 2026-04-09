import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type CustomerStatementPrintPageProps = {
  params: Promise<{ id: string }>;
};

type CustomerRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: string;
  due_date: string | null;
  created_at: string;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  amount_received: number;
  payment_date: string;
  payment_method: string | null;
  invoice: {
    invoice_number: string | null;
  } | null;
};

export default async function CustomerStatementPrintPage({
  params,
}: CustomerStatementPrintPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customerData }, { data: invoicesData }, { data: receiptsData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, company_name, contact_person")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("payment_invoices")
        .select(`
          id,
          invoice_number,
          amount,
          amount_paid,
          balance,
          status,
          due_date,
          created_at
        `)
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("receipts")
        .select(`
          id,
          receipt_number,
          amount_received,
          payment_date,
          payment_method,
          invoice:payment_invoices(invoice_number)
        `)
        .eq("customer_id", id)
        .order("payment_date", { ascending: false }),
    ]);

  if (!customerData) {
    notFound();
  }

  const customer = customerData as CustomerRow;
  const invoices = (invoicesData ?? []) as InvoiceRow[];
  const receipts = (receiptsData ?? []) as ReceiptRow[];

  const totalInvoiced = invoices.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = receipts.reduce(
    (sum, item) => sum + Number(item.amount_received || 0),
    0
  );
  const outstandingBalance = invoices.reduce(
    (sum, item) => sum + Number(item.balance || 0),
    0
  );

  return (
    <DocumentShell
      title="Customer Statement"
      documentNumber={customer.company_name}
    >
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <DocumentInfoRow label="Customer" value={customer.company_name} />
            <DocumentInfoRow
              label="Contact Person"
              value={customer.contact_person || "-"}
            />
            <DocumentInfoRow
              label="Generated On"
              value={formatDateTime(new Date().toISOString())}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Total Invoiced" value={formatCurrency(totalInvoiced)} />
          <SummaryCard label="Total Paid" value={formatCurrency(totalPaid)} />
          <SummaryCard
            label="Outstanding Balance"
            value={formatCurrency(outstandingBalance)}
          />
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Invoices</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
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
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(invoice.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-4 py-4 text-sm capitalize text-slate-600">
                      {invoice.status}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-900">
                      {formatCurrency(invoice.amount_paid)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(invoice.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Receipts</h3>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Receipt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {receipt.receipt_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {receipt.invoice?.invoice_number || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(receipt.payment_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {receipt.payment_method || "-"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(receipt.amount_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}