import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { QuotationStatusBadge } from "@/components/quotations/quotation-status-badge";

type QuotationRow = {
  id: string;
  quote_number: string;
  company_name: string;
  contact_person: string | null;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  valid_until: string | null;
  created_at: string;
};

export function QuotationTable({ quotations }: { quotations: QuotationRow[] }) {
  if (quotations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No quotations found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {quotations.map((quotation) => (
          <div
            key={quotation.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {quotation.company_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {quotation.quote_number}
                </p>
              </div>

              <QuotationStatusBadge status={quotation.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Contact: {quotation.contact_person || "-"}</p>
              <p>Total: {formatCurrency(quotation.total)}</p>
              <p>Valid Until: {formatDate(quotation.valid_until)}</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/quotations/${quotation.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Quotation
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quote Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Valid Until
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
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td className="px-4 py-4 text-sm text-slate-900">
                    {quotation.quote_number}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {quotation.company_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {quotation.contact_person || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(quotation.total)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(quotation.valid_until)}
                  </td>
                  <td className="px-4 py-4">
                    <QuotationStatusBadge status={quotation.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/quotations/${quotation.id}`}
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
    </>
  );
}