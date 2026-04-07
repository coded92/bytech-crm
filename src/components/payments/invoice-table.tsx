import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { InvoiceStatusBadge } from "@/components/payments/invoice-status-badge";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  customer: {
    company_name: string | null;
  } | null;
};

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No invoices found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {invoice.customer?.company_name ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">
                  {invoice.invoice_type.replaceAll("_", " ")}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatCurrency(invoice.amount)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatCurrency(invoice.balance)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatDate(invoice.due_date)}
                </td>
                <td className="px-4 py-4">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/payments/invoices/${invoice.id}`}
                    className="text-sm font-medium text-slate-900 underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}