import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { AssetEditForm } from "@/components/assets/asset-edit-form";

type EditAssetPageProps = {
  params: Promise<{ id: string }>;
};

type AssetData = {
  id: string;
  device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
  serial_number: string | null;
  customer_id: string | null;
  branch_id: string | null;
  deployment_id: string | null;
  condition: "new" | "good" | "faulty" | "under_repair" | "retired";
  status: "active" | "inactive" | "lost" | "retired";
  purchase_date: string | null;
  notes: string | null;
};

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

export default async function EditAssetPage({
  params,
}: EditAssetPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: assetData }, { data: customersData }, { data: branchesData }, { data: deploymentsData }] =
    await Promise.all([
      supabase
        .from("assets")
        .select("id, device_type, serial_number, customer_id, branch_id, deployment_id, condition, status, purchase_date, notes")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("customers").select("id, company_name").order("company_name"),
      supabase.from("customer_branches").select("id, branch_name").order("branch_name"),
      supabase.from("pos_deployments").select("id, deployment_number").order("created_at", {
        ascending: false,
      }),
    ]);

  if (!assetData) {
    notFound();
  }

  const asset = assetData as AssetData;
  const customers = (customersData ?? []) as CustomerOption[];
  const branches = (branchesData ?? []) as BranchOption[];
  const deployments = (deploymentsData ?? []) as DeploymentOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Asset
        </h2>
        <p className="text-slate-600">
          Update asset information and assignment.
        </p>
      </div>

      <AssetEditForm
        asset={asset}
        customers={customers}
        branches={branches}
        deployments={deployments}
      />
    </div>
  );
}