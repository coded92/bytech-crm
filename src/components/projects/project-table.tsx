import Link from "next/link";
import { formatUserDate } from "@/lib/preferences/format";
import type { UserPreferenceSnapshot } from "@/lib/preferences/user-preferences";
import { formatCurrency } from "@/lib/utils/format-currency";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Badge } from "@/components/ui/badge";

type ProjectRow = {
  id: string;
  project_code: string;
  project_name: string;
  project_type:
    | "website_development"
    | "pos_deployment"
    | "crm_setup"
    | "digital_marketing"
    | "networking_infrastructure"
    | "maintenance"
    | "custom_software"
    | "other";
  status:
    | "proposal"
    | "approved"
    | "paid"
    | "planning"
    | "in_progress"
    | "review"
    | "completed"
    | "maintenance"
    | "on_hold"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  deadline: string | null;
  progress: number;
  quotation_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  customer?: {
    company_name: string | null;
  } | null;
  project_manager?: {
    full_name: string | null;
  } | null;
};

export function ProjectTable({
  projects,
  dateFormat = "DD/MM/YYYY",
}: {
  projects: ProjectRow[];
  dateFormat?: UserPreferenceSnapshot["date_format"];
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No projects found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {project.project_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {project.project_code}
                </p>
              </div>

              <ProjectStatusBadge status={project.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Client: {project.customer?.company_name || "-"}</p>
              <p className="capitalize">
                Type: {project.project_type.replaceAll("_", " ")}
              </p>
              <p>Manager: {project.project_manager?.full_name || "-"}</p>
              <p>Deadline: {formatUserDate(project.deadline, { date_format: dateFormat })}</p>
              <p>Progress: {project.progress}%</p>
              <p>Balance: {formatCurrency(project.outstanding_balance)}</p>
            </div>

            <div className="mt-4 flex gap-4">
              <Link
                href={`/projects/${project.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View
              </Link>

              <Link
                href={`/projects/${project.id}/edit`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                Edit
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
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Manager
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Balance
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
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">
                      {project.project_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {project.project_code}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {project.customer?.company_name || "-"}
                  </td>

                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {project.project_type.replaceAll("_", " ")}
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant="outline" className="capitalize">
                      {project.priority}
                    </Badge>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {project.project_manager?.full_name || "-"}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {project.progress}%
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(project.outstanding_balance)}
                  </td>

                  <td className="px-4 py-4">
                    <ProjectStatusBadge status={project.status} />
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        View
                      </Link>

                      <Link
                        href={`/projects/${project.id}/edit`}
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
