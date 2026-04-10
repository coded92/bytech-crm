import { createClient } from "@/lib/supabase/server";
import { FieldJobForm } from "@/components/field-jobs/field-job-form";

type CustomerOption = {
  id: string;
  company_name: string;
};

type BranchOption = {
  id: string;
  branch_name: string;
};

type AssetOption = {
  id: string;
  asset_tag: string;
};

type SupportOption = {
  id: string;
  ticket_number: string;
};

type EngineerOption = {
  id: string;
  full_name: string;
};

export default async function NewFieldJobPage() {
  const supabase = await createClient();

  const [
    { data: customersData },
    { data: branchesData },
    { data: assetsData },
    { data: supportData },
    { data: engineersData },
  ] = await Promise.all([
    supabase.from("customers").select("id, company_name").order("company_name"),
    supabase.from("customer_branches").select("id, branch_name").order("branch_name"),
    supabase.from("assets").select("id, asset_tag").order("asset_tag"),
    supabase.from("support_tickets").select("id, ticket_number").order("created_at", {
      ascending: false,
    }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const customers = (customersData ?? []) as CustomerOption[];
  const branches = (branchesData ?? []) as BranchOption[];
  const assets = (assetsData ?? []) as AssetOption[];
  const supportTickets = (supportData ?? []) as SupportOption[];
  const engineers = (engineersData ?? []) as EngineerOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Field Job
        </h2>
        <p className="text-slate-600">
          Create and assign a new engineer operations job.
        </p>
      </div>

      <FieldJobForm
        customers={customers}
        branches={branches}
        assets={assets}
        supportTickets={supportTickets}
        engineers={engineers}
      />
    </div>
  );
}