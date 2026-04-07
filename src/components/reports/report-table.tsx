import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";

type ReportRow = {
  id: string;
  report_date: string;
  summary: string;
  tasks_completed_count: number;
  leads_contacted_count: number;
  customers_supported_count: number;
  submitted_at: string;
  staff?: {
    full_name: string | null;
  } | null;
};

export function ReportTable({ reports }: { reports: ReportRow[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No reports found.
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
                Report Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Staff
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Metrics
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Submitted
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-4 py-4 text-sm text-slate-900">
                  {formatDate(report.report_date)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {report.staff?.full_name ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  <div className="max-w-md truncate">{report.summary}</div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-600">
                  <div>Tasks: {report.tasks_completed_count}</div>
                  <div>Leads: {report.leads_contacted_count}</div>
                  <div>Support: {report.customers_supported_count}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatDateTime(report.submitted_at)}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/reports/${report.id}`}
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