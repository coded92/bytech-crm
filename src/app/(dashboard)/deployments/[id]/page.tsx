import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DeploymentStatusBadge } from "@/components/deployments/deployment-status-badge";
import { ArchiveDeploymentButton } from "@/components/deployments/archive-deployment-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeploymentDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type DeploymentRow = {
  id: string;
  deployment_number: string;
  deployment_type: "new_installation" | "upgrade" | "replacement" | "maintenance";
  terminal_count: number;
  deployment_status: "planned" | "in_progress" | "completed" | "cancelled";
  install_date: string | null;
  go_live_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer: { company_name: string | null } | null;
  branch: {
    branch_name: string | null;
    contact_person: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
  deployed_profile: { full_name: string | null } | null;
};

export default async function DeploymentDetailsPage({
  params,
}: DeploymentDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("pos_deployments")
    .select(`
      id,
      deployment_number,
      deployment_type,
      terminal_count,
      deployment_status,
      install_date,
      go_live_date,
      notes,
      created_at,
      updated_at,
      customer:customers(company_name),
      branch:customer_branches(branch_name, contact_person, phone, address, city, state),
      deployed_profile:profiles!pos_deployments_deployed_by_fkey(full_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const deployment = data as DeploymentRow;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {deployment.deployment_number}
          </h2>
          <p className="text-slate-600">
            {deployment.customer?.company_name || "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DeploymentStatusBadge status={deployment.deployment_status} />
          <Button asChild variant="outline">
            <Link href={`/deployments/${deployment.id}/edit`}>
              Edit Deployment
            </Link>
          </Button>
          <ArchiveDeploymentButton deploymentId={deployment.id} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Deployment Number" value={deployment.deployment_number} />
              <InfoItem label="Customer" value={deployment.customer?.company_name || "-"} />
              <InfoItem
                label="Deployment Type"
                value={deployment.deployment_type.replaceAll("_", " ")}
              />
              <InfoItem label="Terminal Count" value={String(deployment.terminal_count)} />
              <InfoItem label="Install Date" value={formatDate(deployment.install_date)} />
              <InfoItem label="Go Live Date" value={formatDate(deployment.go_live_date)} />
              <InfoItem
                label="Assigned Staff"
                value={deployment.deployed_profile?.full_name || "-"}
              />
              <InfoItem label="Status" value={deployment.deployment_status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branch Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Branch Name" value={deployment.branch?.branch_name || "-"} />
              <InfoItem label="Contact Person" value={deployment.branch?.contact_person || "-"} />
              <InfoItem label="Phone" value={deployment.branch?.phone || "-"} />
              <InfoItem label="City" value={deployment.branch?.city || "-"} />
              <InfoItem label="State" value={deployment.branch?.state || "-"} />
              <InfoItem label="Address" value={deployment.branch?.address || "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {deployment.notes || "-"}
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
              <SummaryItem label="Created" value={formatDateTime(deployment.created_at)} />
              <SummaryItem label="Updated" value={formatDateTime(deployment.updated_at)} />
              <SummaryItem label="Status" value={deployment.deployment_status} />
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