import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RenewalProject = {
  id: string;
  project_code: string;
  project_name: string;
  annual_renewal_amount: number;
  next_renewal_date: string | null;
  status: string;
  customer?: {
    company_name: string | null;
  } | null;
};

export default async function ProjectRenewalsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_code,
      project_name,
      annual_renewal_amount,
      next_renewal_date,
      status,
      customer:customers(company_name)
    `)
    .eq("recurring_revenue", true)
    .order("next_renewal_date", { ascending: true });

  const projects = (data ?? []) as RenewalProject[];

  const totalRenewalValue = projects.reduce(
    (sum, project) => sum + Number(project.annual_renewal_amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Project Renewals
          </h2>
          <p className="text-slate-600">
            Track recurring project revenue and upcoming renewal dates.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Renewal Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {projects.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Annual Renewal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalRenewalValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load renewals: {error.message}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No recurring projects found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    Renewal Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Next Renewal
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

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatCurrency(project.annual_renewal_amount)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDate(project.next_renewal_date)}
                    </td>

                    <td className="px-4 py-4 text-sm capitalize text-slate-600">
                      {project.status.replaceAll("_", " ")}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/projects/${project.id}`}
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
      )}
    </div>
  );
}