import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { DeploymentTable } from "@/components/deployments/deployment-table";
import { Button } from "@/components/ui/button";

type DeploymentRow = {
  id: string;
  deployment_number: string;
  deployment_type: "new_installation" | "upgrade" | "replacement" | "maintenance";
  terminal_count: number;
  deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
  install_date: string | null;
  go_live_date: string | null;
  customer: { company_name: string | null } | null;
  branch: { branch_name: string | null } | null;
};

export default async function DeploymentsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pos_deployments")
    .select(`
      id,
      deployment_number,
      deployment_type,
      terminal_count,
      deployment_status,
      install_date,
      go_live_date,
      customer:customers(company_name),
      branch:customer_branches(branch_name)
    `)
    .order("created_at", { ascending: false });

  const deployments = (data ?? []) as DeploymentRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Deployments
          </h2>
          <p className="text-slate-600">
            Track branch installations, upgrades, and maintenance.
          </p>
        </div>

        {profile.role === "admin" ? (
          <Button asChild>
            <Link href="/deployments/new">New Deployment</Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load deployments: {error.message}
        </div>
      ) : (
        <DeploymentTable deployments={deployments} />
      )}
    </div>
  );
}