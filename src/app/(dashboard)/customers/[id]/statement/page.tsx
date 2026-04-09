import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CustomerStatementPageProps = {
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

export default async function CustomerStatementPage({
  params,
}: CustomerStatementPageProps) {
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

  const exportRows: Array<Array<string | number | null | undefined>> = [
    ...invoices.map((invoice) => [
      "Invoice",
      invoice.invoice_number,
      formatDateTime(invoice.created_at),
      formatDate(invoice.due_date),
      invoice.status,
      invoice.amount,
      invoice.amount_paid,
      invoice.balance,
    ]),
    ...receipts.map((receipt) => [
      "Receipt",
      receipt.receipt_number,
      formatDateTime(receipt.payment_date),
      "",
      receipt.payment_method || "",
      receipt.amount_received,
      "",
      "",
    ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Statement
          </h2>
          <p className="text-slate-600">{customer.company_name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ExportCsvButton
            filename={`${customer.company_name}-statement.csv`}
            headers={[
              "Type",
              "Number",
              "Date",
              "Due Date",
              "Status / Method",
              "Amount",
              "Paid",
              "Balance",
            ]}
            rows={exportRows}
          />

          <Button asChild variant="outline">
            <Link href={`/customers/${customer.id}/statement/print`}>
              Print Statement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalInvoiced)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalPaid)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-slate-900">
            {formatCurrency(outstandingBalance)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-slate-500">No invoices found.</p>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-sm text-slate-500">No receipts found.</p>
          ) : (
            <div className="overflow-x-auto">
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
                      Payment Date
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}