import Link from "next/link";
import { formatDate } from "@/lib/utils/format-date";
import { FieldJobStatusBadge } from "@/components/field-jobs/field-job-status-badge";

type FieldJobRow = {
  id: string;
  job_number: string;
  title: string;
  job_type: string;
  priority: string;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "cancelled";
  scheduled_date: string | null;
  customer: {
    company_name: string | null;
  } | null;
  assigned_engineer: {
    full_name: string | null;
  } | null;
};

export function FieldJobTable({ jobs }: { jobs: FieldJobRow[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No field jobs found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                <p className="mt-1 text-xs text-slate-500">{job.job_number}</p>
              </div>

              <FieldJobStatusBadge status={job.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Customer: {job.customer?.company_name || "-"}</p>
              <p className="capitalize">Type: {job.job_type.replaceAll("_", " ")}</p>
              <p className="capitalize">Priority: {job.priority}</p>
              <p>Engineer: {job.assigned_engineer?.full_name || "-"}</p>
              <p>Scheduled: {formatDate(job.scheduled_date)}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Link
                href={`/field-jobs/${job.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Job
              </Link>

              <Link
                href={`/field-jobs/${job.id}/edit`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                Edit Job
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
                  Job
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
                  Engineer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Scheduled
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">{job.title}</div>
                    <div className="text-xs text-slate-500">{job.job_number}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {job.customer?.company_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {job.job_type.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {job.priority}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {job.assigned_engineer?.full_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(job.scheduled_date)}
                  </td>
                  <td className="px-4 py-4">
                    <FieldJobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/field-jobs/${job.id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/field-jobs/${job.id}/edit`}
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