import Link from "next/link";
import { formatDate } from "@/lib/utils/format-date";
import { DeploymentStatusBadge } from "@/components/deployments/deployment-status-badge";

type DeploymentRow = {
  id: string;
  deployment_number: string;
  deployment_type: "new_installation" | "upgrade" | "replacement" | "maintenance";
  terminal_count: number;
  deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
  install_date: string | null;
  go_live_date: string | null;
  customer: {
    company_name: string | null;
  } | null;
  branch: {
    branch_name: string | null;
  } | null;
};

export function DeploymentTable({
  deployments,
}: {
  deployments: DeploymentRow[];
}) {
  if (deployments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No deployments found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {deployments.map((deployment) => (
          <div
            key={deployment.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {deployment.customer?.company_name || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {deployment.deployment_number}
                </p>
              </div>

              <DeploymentStatusBadge status={deployment.deployment_status} />
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Branch: {deployment.branch?.branch_name || "-"}</p>
              <p className="capitalize">
                Type: {deployment.deployment_type.replaceAll("_", " ")}
              </p>
              <p>Terminals: {deployment.terminal_count}</p>
              <p>Install Date: {formatDate(deployment.install_date)}</p>
              <p>Go Live: {formatDate(deployment.go_live_date)}</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/deployments/${deployment.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Deployment
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
                  Deployment
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Terminals
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Install Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {deployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {deployment.deployment_number}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {deployment.customer?.company_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {deployment.branch?.branch_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {deployment.deployment_type.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {deployment.terminal_count}
                  </td>
                  <td className="px-4 py-4">
                    <DeploymentStatusBadge status={deployment.deployment_status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(deployment.install_date)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/deployments/${deployment.id}`}
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