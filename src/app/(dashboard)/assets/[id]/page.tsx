import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import { AssetConditionBadge } from "@/components/assets/asset-condition-badge";
import { RepairHistoryForm } from "@/components/assets/repair-history-form";
import { ArchiveAssetButton } from "@/components/assets/archive-asset-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

type RepairHistoryRow = {
  id: string;
  repair_title: string;
  repair_type: "inspection" | "repair" | "replacement" | "maintenance" | "other";
  repair_status: "pending" | "in_progress" | "completed" | "cancelled";
  cost: number;
  repair_date: string;
  notes: string | null;
  technician: {
    full_name: string | null;
  } | null;
  support_ticket: {
    ticket_number: string | null;
  } | null;
};

type StaffOption = {
  id: string;
  full_name: string;
};

export default async function AssetDetailsPage({
  params,
}: AssetDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: assetData }, { data: historyData }, { data: staffData }] =
    await Promise.all([
      supabase
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
        .maybeSingle(),
      supabase
        .from("asset_repair_history")
        .select(`
          id,
          repair_title,
          repair_type,
          repair_status,
          cost,
          repair_date,
          notes,
          technician:profiles!asset_repair_history_technician_id_fkey(full_name),
          support_ticket:support_tickets(ticket_number)
        `)
        .eq("asset_id", id)
        .order("repair_date", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  if (!assetData) {
    notFound();
  }

  const asset = assetData as AssetRow;
  const history = (historyData ?? []) as RepairHistoryRow[];
  const staff = (staffData ?? []) as StaffOption[];

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
          <Button asChild variant="outline">
            <Link href={`/assets/${asset.id}/edit`}>Edit Asset</Link>
          </Button>
          <ArchiveAssetButton assetId={asset.id} />
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
              <InfoItem
                label="Purchase Date"
                value={formatDate(asset.purchase_date)}
              />
              <InfoItem
                label="Customer"
                value={asset.customer?.company_name || "-"}
              />
              <InfoItem
                label="Branch"
                value={asset.branch?.branch_name || "-"}
              />
              <InfoItem
                label="Deployment"
                value={asset.deployment?.deployment_number || "-"}
              />
              <InfoItem label="Status" value={asset.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Repair History</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">No repair history found.</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.repair_title}
                        </p>
                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {item.repair_type.replaceAll("_", " ")} ·{" "}
                          {item.repair_status.replaceAll("_", " ")}
                        </p>
                      </div>

                      <p className="text-sm font-medium text-slate-900">
                        {item.cost}
                      </p>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Date: {formatDate(item.repair_date)}</p>
                      <p>Technician: {item.technician?.full_name || "-"}</p>
                      <p>Ticket: {item.support_ticket?.ticket_number || "-"}</p>
                      <p>Notes: {item.notes || "-"}</p>
                    </div>
                  </div>
                ))
              )}
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
              <CardTitle>Add Repair History</CardTitle>
            </CardHeader>
            <CardContent>
              <RepairHistoryForm assetId={asset.id} staff={staff} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Condition"
                value={asset.condition.replaceAll("_", " ")}
              />
              <SummaryItem label="Status" value={asset.status} />
              <SummaryItem
                label="Created"
                value={formatDateTime(asset.created_at)}
              />
              <SummaryItem
                label="Updated"
                value={formatDateTime(asset.updated_at)}
              />
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