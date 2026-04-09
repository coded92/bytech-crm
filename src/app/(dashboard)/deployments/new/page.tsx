import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { DeploymentForm } from "@/components/deployments/deployment-form";

type CustomerOption = {
  id: string;
  company_name: string;
};

type StaffOption = {
  id: string;
  full_name: string;
};

export default async function NewDeploymentPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: customersData }, { data: staffData }] = await Promise.all([
    supabase.from("customers").select("id, company_name").order("company_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const customers = (customersData ?? []) as CustomerOption[];
  const staff = (staffData ?? []) as StaffOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          New Deployment
        </h2>
        <p className="text-slate-600">
          Add a branch and create a deployment record.
        </p>
      </div>

      <DeploymentForm customers={customers} staff={staff} />
    </div>
  );
}