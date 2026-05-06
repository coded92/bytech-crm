import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectAnalyticsRow = {
  id: string;
  project_name: string;
  quotation_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  project_cost_estimate: number;
  profit_estimate: number;
  progress: number;
  status: string;
};

export default async function ProjectAnalyticsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select(`
      id,
      project_name,
      quotation_amount,
      amount_paid,
      outstanding_balance,
      project_cost_estimate,
      profit_estimate,
      progress,
      status
    `)
    .order("created_at", { ascending: false });

  const projects = (data ?? []) as ProjectAnalyticsRow[];

  const totalRevenue = projects.reduce(
    (sum, p) => sum + Number(p.quotation_amount || 0),
    0
  );

  const totalPaid = projects.reduce(
    (sum, p) => sum + Number(p.amount_paid || 0),
    0
  );

  const totalOutstanding = projects.reduce(
    (sum, p) => sum + Number(p.outstanding_balance || 0),
    0
  );

  const totalCost = projects.reduce(
    (sum, p) => sum + Number(p.project_cost_estimate || 0),
    0
  );

  const totalProfit = projects.reduce(
    (sum, p) => sum + Number(p.profit_estimate || 0),
    0
  );

  const margin =
    totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Project Analytics
        </h2>
        <p className="text-slate-600">
          Revenue, collections, profitability and delivery overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Revenue" value={formatCurrency(totalRevenue)} />
        <MetricCard title="Collected" value={formatCurrency(totalPaid)} />
        <MetricCard title="Outstanding" value={formatCurrency(totalOutstanding)} />
        <MetricCard title="Cost" value={formatCurrency(totalCost)} />
        <MetricCard title="Profit" value={formatCurrency(totalProfit)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit Margin</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-3xl font-bold text-slate-900">{margin}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Breakdown</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects found.</p>
          ) : (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {project.project_name}
                    </p>

                    <p className="text-sm text-slate-500 capitalize">
                      {project.status.replaceAll("_", " ")} • {project.progress}%
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p>Revenue: {formatCurrency(project.quotation_amount)}</p>
                    <p>Profit: {formatCurrency(project.profit_estimate)}</p>
                    <p>Outstanding: {formatCurrency(project.outstanding_balance)}</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}