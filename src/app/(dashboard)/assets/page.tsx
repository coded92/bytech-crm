import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { AssetTable } from "@/components/assets/asset-table";
import { Button } from "@/components/ui/button";

type AssetRow = {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
  condition: "new" | "good" | "faulty" | "under_repair" | "retired";
  status: "active" | "inactive" | "lost" | "retired";
  purchase_date: string | null;
  customer: {
    company_name: string | null;
  } | null;
  branch: {
    branch_name: string | null;
  } | null;
};

export default async function AssetsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(`
      id,
      asset_tag,
      serial_number,
      device_type,
      condition,
      status,
      purchase_date,
      customer:customers(company_name),
      branch:customer_branches(branch_name)
    `)
    .order("created_at", { ascending: false });

  const assets = (data ?? []) as AssetRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Assets
          </h2>
          <p className="text-slate-600">
            Track POS terminals, printers, scanners, routers, and other devices.
          </p>
        </div>

        {profile.role === "admin" ? (
          <Button asChild>
            <Link href="/assets/new">Add Asset</Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load assets: {error.message}
        </div>
      ) : (
        <AssetTable assets={assets} />
      )}
    </div>
  );
}