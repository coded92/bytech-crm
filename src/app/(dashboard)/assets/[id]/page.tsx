import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import { AssetConditionBadge } from "@/components/assets/asset-condition-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssetDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type AssetRow = {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  device_type: "pos_terminal" | "printer" | "scanner" | "router" | "other";
  condition: "new" | "good" | "faulty" | "under_repair" | "retired";
  status: "active" | "inactive" | "lost" | "retired";
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    company_name: string | null;
  } | null;
  branch: {
    branch_name: string | null;
  } | null;
  deployment: {
    deployment_number: string | null;
  } | null;
};

export default async function AssetDetailsPage({
  params,
}: AssetDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("assets")
    .select(`
      id,
      asset_tag,
      serial_number,
      device_type,
      condition,
      status,
      purchase_date,
      notes,
      created_at,
      updated_at,
      customer:customers(company_name),
      branch:customer_branches(branch_name),
      deployment:pos_deployments(deployment_number)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const asset = data as AssetRow;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {asset.asset_tag}
          </h2>
          <p className="text-slate-600">
            {asset.serial_number || "No serial number"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <AssetConditionBadge condition={asset.condition} />
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Asset Tag" value={asset.asset_tag} />
              <InfoItem label="Serial Number" value={asset.serial_number} />
              <InfoItem
                label="Device Type"
                value={asset.device_type.replaceAll("_", " ")}
              />
              <InfoItem label="Purchase Date" value={formatDate(asset.purchase_date)} />
              <InfoItem label="Customer" value={asset.customer?.company_name || "-"} />
              <InfoItem label="Branch" value={asset.branch?.branch_name || "-"} />
              <InfoItem
                label="Deployment"
                value={asset.deployment?.deployment_number || "-"}
              />
              <InfoItem label="Status" value={asset.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {asset.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem label="Condition" value={asset.condition.replaceAll("_", " ")} />
              <SummaryItem label="Status" value={asset.status} />
              <SummaryItem label="Created" value={formatDateTime(asset.created_at)} />
              <SummaryItem label="Updated" value={formatDateTime(asset.updated_at)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">{value}</span>
    </div>
  );
}