import Link from "next/link";
import { formatDateTime } from "@/lib/utils/format-date";
import { SupportStatusBadge } from "@/components/support/support-status-badge";
import { Badge } from "@/components/ui/badge";

type SupportRow = {
  id: string;
  ticket_number: string;
  title: string;
  issue_type: "hardware" | "software" | "network" | "training" | "billing" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  customer?: {
    company_name: string | null;
  } | null;
  assigned_profile?: {
    full_name: string | null;
  } | null;
};

export function SupportTable({ tickets }: { tickets: SupportRow[] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No support tickets found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {ticket.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {ticket.ticket_number}
                </p>
              </div>

              <SupportStatusBadge status={ticket.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Customer: {ticket.customer?.company_name || "-"}</p>
              <p className="capitalize">Type: {ticket.issue_type}</p>
              <p className="capitalize">Priority: {ticket.priority}</p>
              <p>Assigned: {ticket.assigned_profile?.full_name || "-"}</p>
              <p>Created: {formatDateTime(ticket.created_at)}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Link
                href={`/support/${ticket.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Ticket
              </Link>

              <Link
                href={`/support/${ticket.id}/edit`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                Edit Ticket
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">{ticket.title}</div>
                    <div className="text-xs text-slate-500">{ticket.ticket_number}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {ticket.customer?.company_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {ticket.issue_type}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <SupportStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {ticket.assigned_profile?.full_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDateTime(ticket.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/support/${ticket.id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/support/${ticket.id}/edit`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        Edit
                      </Link>
                    </div>
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