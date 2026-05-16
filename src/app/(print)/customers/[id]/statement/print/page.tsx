import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

type CustomerStatementPrintPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
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
  searchParams,
}: CustomerStatementPrintPageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const supabase = await createClient();

  let invoicesQuery = supabase
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
    .eq("customer_id", id);

  let receiptsQuery = supabase
    .from("receipts")
    .select(`
      id,
      receipt_number,
      amount_received,
      payment_date,
      payment_method,
      invoice:payment_invoices(invoice_number)
    `)
    .eq("customer_id", id);

  if (from) {
    invoicesQuery = invoicesQuery.gte("created_at", from);
    receiptsQuery = receiptsQuery.gte("payment_date", from);
  }

  if (to) {
    invoicesQuery = invoicesQuery.lte("created_at", to);
    receiptsQuery = receiptsQuery.lte("payment_date", to);
  }

  const [{ data: customerData }, { data: invoicesData }, { data: receiptsData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, company_name, contact_person")
        .eq("id", id)
        .maybeSingle(),
      invoicesQuery.order("created_at", { ascending: false }),
      receiptsQuery.order("payment_date", { ascending: false }),
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
  const agingSummary = getAgingSummary(invoices);
  const statementStatus =
    outstandingBalance > 0
      ? { label: "Balance Due", tone: "warning" as const }
      : { label: "Settled", tone: "success" as const };
  const statementPeriod =
    from || to
      ? `${from ? formatDate(from) : "Beginning"} - ${to ? formatDate(to) : "Present"}`
      : "All available transactions";

  return (
    <DocumentShell
      title="Customer Statement"
      documentNumber={customer.company_name}
    >
      <div className="space-y-9">
        <section className="document-avoid-break grid gap-6 border-y border-slate-950 py-6 md:grid-cols-[1.4fr_0.8fr] print:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Account Statement
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-950">
              {formatCurrency(outstandingBalance)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Outstanding balance for {customer.company_name}. This statement
              summarizes invoices, receipts, and open balances recorded in BYTECH
              CRM for the selected account scope.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end print:items-end">
            <DocumentStatusStamp
              status={statementStatus.label}
              tone={statementStatus.tone}
            />
            <div className="w-full border border-slate-200 p-4 md:max-w-xs print:max-w-xs">
              <DocumentInfoRow label="Statement Period" value={statementPeriod} />
              <div className="mt-4">
                <DocumentInfoRow
                  label="Generated On"
                  value={formatDateTime(new Date().toISOString())}
                />
              </div>
            </div>
          </div>
        </section>

        <DocumentSection title="Customer Account">
          <div className="grid gap-5 border border-slate-200 p-5 md:grid-cols-3 print:grid-cols-3">
            <DocumentInfoRow label="Customer" value={customer.company_name} />
            <DocumentInfoRow
              label="Contact Person"
              value={customer.contact_person || "-"}
            />
            <DocumentInfoRow label="Account ID" value={customer.id} />
          </div>
        </DocumentSection>

        <DocumentSection title="Statement Summary">
          <DocumentTotals
            className="max-w-none"
            rows={[
              { label: "Total Invoiced", value: formatCurrency(totalInvoiced) },
              { label: "Total Receipts / Payments", value: formatCurrency(totalPaid) },
              {
                label: "Outstanding Balance",
                value: formatCurrency(outstandingBalance),
                strong: true,
              },
            ]}
          />
        </DocumentSection>

        <DocumentSection
          title="Aging Summary"
          description="Open balances grouped by invoice due date."
        >
          <DocumentTable>
            <thead>
              <tr>
                <th className="w-1/4">Current</th>
                <th className="w-1/4 text-right">1-30 Days</th>
                <th className="w-1/4 text-right">31-60 Days</th>
                <th className="w-1/4 text-right">61+ Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatCurrency(agingSummary.current)}</td>
                <td className="text-right">{formatCurrency(agingSummary.days1To30)}</td>
                <td className="text-right">{formatCurrency(agingSummary.days31To60)}</td>
                <td className="text-right">{formatCurrency(agingSummary.days61Plus)}</td>
              </tr>
            </tbody>
          </DocumentTable>
        </DocumentSection>

        <DocumentSection
          title="Invoices"
          description="Invoices included in this account statement."
        >
          {invoices.length > 0 ? (
            <DocumentTable>
              <thead className="bg-slate-50">
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-medium text-slate-950">{invoice.invoice_number}</td>
                    <td>{formatDate(invoice.created_at)}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td className="capitalize">{invoice.status}</td>
                    <td className="text-right">{formatCurrency(invoice.amount)}</td>
                    <td className="text-right">{formatCurrency(invoice.amount_paid)}</td>
                    <td className="text-right font-semibold text-slate-950">
                      {formatCurrency(invoice.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          ) : (
            <p className="border border-slate-200 p-4 text-sm text-slate-600">
              No invoices were found for this statement scope.
            </p>
          )}
        </DocumentSection>

        <DocumentSection
          title="Receipts / Payments"
          description="Payment receipts recorded against this customer account."
        >
          {receipts.length > 0 ? (
            <DocumentTable>
              <thead className="bg-slate-50">
                <tr>
                  <th>Receipt</th>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="font-medium text-slate-950">
                      {receipt.receipt_number}
                    </td>
                    <td>{receipt.invoice?.invoice_number || "-"}</td>
                    <td>{formatDate(receipt.payment_date)}</td>
                    <td>{receipt.payment_method || "-"}</td>
                    <td className="text-right font-semibold text-slate-950">
                      {formatCurrency(receipt.amount_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          ) : (
            <p className="border border-slate-200 p-4 text-sm text-slate-600">
              No receipts or payments were found for this statement scope.
            </p>
          )}
        </DocumentSection>

        <DocumentSection title="Statement Notes">
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            This account statement is generated from recorded invoices and
            receipts in BYTECH CRM. Opening balances and external adjustments are
            not shown unless they are represented by invoice or receipt records
            in this statement scope. Please contact BYTECH for clarification if
            any transaction appears incorrect.
          </div>
        </DocumentSection>
      </div>
    </DocumentShell>
  );
}

function getAgingSummary(invoices: InvoiceRow[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return invoices.reduce(
    (summary, invoice) => {
      const balance = Number(invoice.balance || 0);

      if (balance <= 0) {
        return summary;
      }

      if (!invoice.due_date) {
        summary.current += balance;
        return summary;
      }

      const dueDate = new Date(invoice.due_date);
      const dueDay = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      ).getTime();
      const daysPastDue = Math.floor((today - dueDay) / 86_400_000);

      if (daysPastDue <= 0) {
        summary.current += balance;
      } else if (daysPastDue <= 30) {
        summary.days1To30 += balance;
      } else if (daysPastDue <= 60) {
        summary.days31To60 += balance;
      } else {
        summary.days61Plus += balance;
      }

      return summary;
    },
    {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61Plus: 0,
    }
  );
}
