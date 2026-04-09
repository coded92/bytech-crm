import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format-date";
import { SupportStatusBadge } from "@/components/support/support-status-badge";
import { SupportUpdateForm } from "@/components/support/support-update-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportAttachmentUploadForm } from "@/components/support/support-attachment-upload-form";
import { AttachmentList } from "@/components/shared/attachment-list";

type SupportDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type StaffOption = {
  id: string;
  full_name: string;
};

type SupportTicketRow = {
  id: string;
  title: string;
  ticket_number: string;
  issue_type:
    | "hardware"
    | "software"
    | "network"
    | "training"
    | "billing"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  description: string | null;
  resolution_notes: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { id: string; company_name: string | null } | null;
  asset: { id: string; asset_tag: string | null } | null;
  assigned_profile: { full_name: string | null } | null;
  creator: { full_name: string | null } | null;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export default async function SupportDetailsPage({
  params,
}: SupportDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: ticketData },
    { data: staffData },
    { data: attachmentsData },
  ] = await Promise.all([
    supabase
      .from("support_tickets")
      .select(`
        id,
        title,
        ticket_number,
        issue_type,
        priority,
        status,
        description,
        resolution_notes,
        assigned_to,
        resolved_at,
        created_at,
        updated_at,
        customer:customers(id, company_name),
        asset:assets(id, asset_tag),
        assigned_profile:profiles!support_tickets_assigned_to_fkey(full_name),
        creator:profiles!support_tickets_created_by_fkey(full_name)
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),

    (supabase as any)
      .from("file_attachments")
      .select(
        "id, file_name, file_path, bucket_name, mime_type, file_size, created_at"
      )
      .eq("related_table", "support_tickets")
      .eq("related_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!ticketData) {
    notFound();
  }

  const ticket = ticketData as SupportTicketRow;
  const staff = (staffData ?? []) as StaffOption[];
  const attachments = (attachmentsData ?? []) as AttachmentRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {ticket.title}
          </h2>
          <p className="text-slate-600">{ticket.ticket_number}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SupportStatusBadge status={ticket.status} />

          {ticket.customer?.id ? (
            <Button asChild variant="outline">
              <Link href={`/customers/${ticket.customer.id}`}>View Customer</Link>
            </Button>
          ) : null}

          {ticket.asset?.id ? (
            <Button asChild variant="outline">
              <Link href={`/assets/${ticket.asset.id}`}>View Asset</Link>
            </Button>
          ) : null}

          <Button asChild variant="outline">
            <Link href={`/support/${ticket.id}/service-report`}>
              Service Report
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Ticket Number" value={ticket.ticket_number} />
              <InfoItem
                label="Customer"
                value={ticket.customer?.company_name || "-"}
              />
              <InfoItem
                label="Linked Asset"
                value={ticket.asset?.asset_tag || "-"}
              />
              <InfoItem label="Issue Type" value={ticket.issue_type} />
              <InfoItem label="Priority" value={ticket.priority} />
              <InfoItem label="Status" value={ticket.status} />
              <InfoItem
                label="Assigned To"
                value={ticket.assigned_profile?.full_name || "-"}
              />
              <InfoItem
                label="Created By"
                value={ticket.creator?.full_name || "-"}
              />
              <InfoItem
                label="Created At"
                value={formatDateTime(ticket.created_at)}
              />
              <InfoItem
                label="Updated At"
                value={formatDateTime(ticket.updated_at)}
              />
              <InfoItem
                label="Resolved At"
                value={formatDateTime(ticket.resolved_at)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {ticket.description || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {ticket.resolution_notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SupportUpdateForm
            ticketId={ticket.id}
            currentStatus={ticket.status}
            currentAssignedTo={ticket.assigned_to}
            currentResolutionNotes={ticket.resolution_notes}
            staff={staff}
          />

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SupportAttachmentUploadForm ticketId={ticket.id} />
              <AttachmentList
                attachments={attachments}
                canDelete={true}
                revalidatePaths={[`/support/${ticket.id}`]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem label="Priority" value={ticket.priority} />
              <SummaryItem label="Status" value={ticket.status} />
              <SummaryItem label="Type" value={ticket.issue_type} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">{value}</span>
    </div>
  );
}