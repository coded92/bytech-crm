import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { AssetForm } from "@/components/assets/asset-form";

type CustomerOption = {
  id: string;
  company_name: string;
};

type BranchOption = {
  id: string;
  branch_name: string;
};

type DeploymentOption = {
  id: string;
  deployment_number: string;
};

export default async function NewAssetPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: customersData }, { data: branchesData }, { data: deploymentsData }] =
    await Promise.all([
      supabase.from("customers").select("id, company_name").order("company_name"),
      supabase.from("customer_branches").select("id, branch_name").order("branch_name"),
      supabase.from("pos_deployments").select("id, deployment_number").order("created_at", {
        ascending: false,
      }),
    ]);

  const customers = (customersData ?? []) as CustomerOption[];
  const branches = (branchesData ?? []) as BranchOption[];
  const deployments = (deploymentsData ?? []) as DeploymentOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Asset
        </h2>
        <p className="text-slate-600">
          Register a device and link it to a customer, branch, or deployment.
        </p>
      </div>

      <AssetForm
        customers={customers}
        branches={branches}
        deployments={deployments}
      />
    </div>
  );
}