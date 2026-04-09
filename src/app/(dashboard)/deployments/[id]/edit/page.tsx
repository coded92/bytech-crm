import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { DeploymentEditForm } from "@/components/deployments/deployment-edit-form";

type EditDeploymentPageProps = {
  params: Promise<{ id: string }>;
};

type DeploymentData = {
  id: string;
  customer_id: string;
  deployment_type: "new_installation" | "upgrade" | "replacement" | "maintenance";
  terminal_count: number;
  deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
  deployed_by: string | null;
  install_date: string | null;
  go_live_date: string | null;
  notes: string | null;
  branch: {
    branch_name: string | null;
    contact_person: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type StaffOption = {
  id: string;
  full_name: string;
};

export default async function EditDeploymentPage({
  params,
}: EditDeploymentPageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: deploymentData }, { data: customersData }, { data: staffData }] =
    await Promise.all([
      supabase
        .from("pos_deployments")
        .select(`
          id,
          customer_id,
          deployment_type,
          terminal_count,
          deployment_status,
          deployed_by,
          install_date,
          go_live_date,
          notes,
          branch:customer_branches(branch_name, contact_person, phone, address, city, state)
        `)
        .eq("id", id)
        .maybeSingle(),
      supabase.from("customers").select("id, company_name").order("company_name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  if (!deploymentData) {
    notFound();
  }

  const deployment = deploymentData as DeploymentData;
  const customers = (customersData ?? []) as CustomerOption[];
  const staff = (staffData ?? []) as StaffOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Deployment
        </h2>
        <p className="text-slate-600">
          Update deployment and branch information.
        </p>
      </div>

      <DeploymentEditForm
        deployment={deployment}
        customers={customers}
        staff={staff}
      />
    </div>
  );
}

