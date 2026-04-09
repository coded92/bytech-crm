import { createClient } from "@/lib/supabase/server";
import { SupportForm } from "@/components/support/support-form";

type CustomerOption = {
  id: string;
  company_name: string;
};

type StaffOption = {
  id: string;
  full_name: string;
};

type AssetOption = {
  id: string;
  asset_tag: string;
};

export default async function NewSupportTicketPage() {
  const supabase = await createClient();

  const [{ data: customersData }, { data: staffData }, { data: assetsData }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
      supabase.from("assets").select("id, asset_tag").order("asset_tag"),
    ]);

  const customers = (customersData ?? []) as CustomerOption[];
  const staff = (staffData ?? []) as StaffOption[];
  const assets = (assetsData ?? []) as AssetOption[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Support Ticket
        </h2>
        <p className="text-slate-600">
          Log a repair, support issue, or customer complaint.
        </p>
      </div>

      <SupportForm customers={customers} staff={staff} assets={assets} />
    </div>
  );
}