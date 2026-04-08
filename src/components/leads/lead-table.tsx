import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";

type LeadRow = {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string | null;
  status: "new" | "contacted" | "interested" | "follow_up" | "closed_won" | "closed_lost";
  estimated_value: number;
  next_follow_up_at: string | null;
  assigned_profile?: {
    full_name: string | null;
  } | null;
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No leads found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Follow-up
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned To
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-slate-900">{lead.company_name}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  <div>{lead.contact_person}</div>
                  <div>{lead.phone || "-"}</div>
                </td>
                <td className="px-4 py-4">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatCurrency(lead.estimated_value)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatDateTime(lead.next_follow_up_at)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {lead.assigned_profile?.full_name || "-"}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/leads/${lead.id}`}
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