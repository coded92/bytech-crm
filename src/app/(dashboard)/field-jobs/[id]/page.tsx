import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { FieldJobStatusBadge } from "@/components/field-jobs/field-job-status-badge";
import { FieldJobPhotoUploadForm } from "@/components/field-jobs/field-job-photo-upload-form";
import { FieldJobUpdateForm } from "@/components/field-jobs/field-job-update-form";
import { FieldJobPhotoGallery } from "@/components/field-jobs/field-job-photo-gallery";
import { FieldJobMaterialForm } from "@/components/field-jobs/field-job-material-form";
import { FieldJobMaterialList } from "@/components/field-jobs/field-job-material-list";
import { FieldJobTimeTrackingForm } from "@/components/field-jobs/field-job-time-tracking-form";
import { FieldJobInventoryUsageForm } from "@/components/field-jobs/field-job-inventory-usage-form";
import { FieldJobInventoryUsageList } from "@/components/field-jobs/field-job-inventory-usage-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldJobDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type FieldJobRow = {
  id: string;
  job_number: string;
  title: string;
  job_type: string;
  priority: string;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "cancelled";
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  reported_issue: string | null;
  work_done: string | null;
  materials_used: string | null;
  recommendation: string | null;
  customer_feedback: string | null;
  checked_in_at: string | null;
  work_started_at: string | null;
  work_completed_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
  customer: { company_name: string | null } | null;
  branch: { branch_name: string | null } | null;
  asset: { asset_tag: string | null } | null;
  support_ticket: { ticket_number: string | null } | null;
  assigned_engineer: { full_name: string | null } | null;
};

type FieldJobUpdateRow = {
  id: string;
  note: string;
  status: string | null;
  created_at: string;
  creator: { full_name: string | null } | null;
};

type FieldJobPhotoRow = {
  id: string;
  photo_type: "before" | "after" | "inspection" | "materials" | "other";
  caption: string | null;
  attachment: {
    id: string;
    file_name: string;
    mime_type: string | null;
    created_at: string;
  } | null;
};

type MaterialRow = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
};

type InventoryItemOption = {
  id: string;
  item_name: string;
  item_code: string;
  current_quantity: number;
  unit: string;
};

type FieldJobInventoryUsageRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  inventory_item: {
    item_name: string | null;
    item_code: string | null;
    unit: string | null;
  } | null;
};

export default async function FieldJobDetailsPage({
  params,
}: FieldJobDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: jobData },
    { data: updatesData },
    { data: photosData },
    { data: materialsData },
    { data: inventoryItemsData },
    { data: usageData },
  ] = await Promise.all([
    supabase
      .from("field_jobs")
      .select(`
        id,
        job_number,
        title,
        job_type,
        priority,
        status,
        scheduled_date,
        started_at,
        completed_at,
        reported_issue,
        work_done,
        materials_used,
        recommendation,
        customer_feedback,
        checked_in_at,
        work_started_at,
        work_completed_at,
        checked_out_at,
        created_at,
        updated_at,
        customer:customers(company_name),
        branch:customer_branches(branch_name),
        asset:assets(asset_tag),
        support_ticket:support_tickets(ticket_number),
        assigned_engineer:profiles!field_jobs_assigned_engineer_id_fkey(full_name)
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("field_job_updates")
      .select(`
        id,
        note,
        status,
        created_at,
        creator:profiles!field_job_updates_created_by_fkey(full_name)
      `)
      .eq("field_job_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("field_job_photos")
      .select(`
        id,
        photo_type,
        caption,
        attachment:file_attachments!field_job_photos_file_attachment_id_fkey(
          id,
          file_name,
          mime_type,
          created_at
        )
      `)
      .eq("field_job_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("field_job_materials")
      .select("id, item_name, quantity, unit, unit_cost, total_cost, notes")
      .eq("field_job_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("inventory_items")
      .select("id, item_name, item_code, current_quantity, unit")
      .order("item_name", { ascending: true }),

    supabase
      .from("field_job_inventory_usage")
      .select(`
        id,
        quantity,
        unit_cost,
        total_cost,
        notes,
        created_at,
        inventory_item:inventory_items(item_name, item_code, unit)
      `)
      .eq("field_job_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!jobData) {
    notFound();
  }

  const job = jobData as FieldJobRow;
  const updates = (updatesData ?? []) as FieldJobUpdateRow[];
  const photos = (photosData ?? []) as FieldJobPhotoRow[];
  const materials = (materialsData ?? []) as MaterialRow[];
  const inventoryItems = (inventoryItemsData ?? []) as InventoryItemOption[];
  const usages = (usageData ?? []) as FieldJobInventoryUsageRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {job.title}
          </h2>
          <p className="text-slate-600">{job.job_number}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <FieldJobStatusBadge status={job.status} />

          <Button asChild variant="outline">
            <Link href={`/field-jobs/${job.id}/edit`}>
              Edit Job
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href={`/field-jobs/${job.id}/service-report`}>
              Service Report
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Job Number" value={job.job_number} />
              <InfoItem label="Customer" value={job.customer?.company_name || "-"} />
              <InfoItem label="Branch" value={job.branch?.branch_name || "-"} />
              <InfoItem label="Asset" value={job.asset?.asset_tag || "-"} />
              <InfoItem
                label="Support Ticket"
                value={job.support_ticket?.ticket_number || "-"}
              />
              <InfoItem
                label="Assigned Engineer"
                value={job.assigned_engineer?.full_name || "-"}
              />
              <InfoItem
                label="Job Type"
                value={job.job_type.replaceAll("_", " ")}
              />
              <InfoItem label="Priority" value={job.priority} />
              <InfoItem
                label="Scheduled Date"
                value={formatDate(job.scheduled_date)}
              />
              <InfoItem
                label="Started At"
                value={formatDateTime(job.started_at)}
              />
              <InfoItem
                label="Completed At"
                value={formatDateTime(job.completed_at)}
              />
              <InfoItem label="Status" value={job.status} />
            </CardContent>
          </Card>

          <TextCard title="Reported Issue / Purpose" value={job.reported_issue} />
          <TextCard title="Work Done" value={job.work_done} />
          <TextCard title="Materials Used (Summary)" value={job.materials_used} />
          <TextCard
            title="Recommendation / Next Step"
            value={job.recommendation}
          />
          <TextCard title="Customer Feedback" value={job.customer_feedback} />

          <Card>
            <CardHeader>
              <CardTitle>Materials / Parts Used</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldJobMaterialForm fieldJobId={job.id} />
              <FieldJobMaterialList materials={materials} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Consumption</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldJobInventoryUsageForm
                fieldJobId={job.id}
                inventoryItems={inventoryItems}
              />
              <FieldJobInventoryUsageList usages={usages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Field Photos</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldJobPhotoUploadForm fieldJobId={job.id} />
              <FieldJobPhotoGallery photos={photos} fieldJobId={job.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Updates</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <FieldJobUpdateForm fieldJobId={job.id} />

              <div className="space-y-4">
                {updates.length === 0 ? (
                  <p className="text-sm text-slate-500">No updates yet.</p>
                ) : (
                  updates.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <p className="text-sm text-slate-900">{item.note}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.creator?.full_name || "Unknown"} ·{" "}
                        {formatDateTime(item.created_at)}
                        {item.status ? ` · ${item.status}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engineer Time Tracking</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <FieldJobTimeTrackingForm
                fieldJobId={job.id}
                checkedInAt={job.checked_in_at}
                workStartedAt={job.work_started_at}
                workCompletedAt={job.work_completed_at}
                checkedOutAt={job.checked_out_at}
              />

              <div className="space-y-3 text-sm">
                <SummaryItem
                  label="Checked In"
                  value={formatDateTime(job.checked_in_at)}
                />
                <SummaryItem
                  label="Work Started"
                  value={formatDateTime(job.work_started_at)}
                />
                <SummaryItem
                  label="Work Completed"
                  value={formatDateTime(job.work_completed_at)}
                />
                <SummaryItem
                  label="Checked Out"
                  value={formatDateTime(job.checked_out_at)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem label="Created" value={formatDateTime(job.created_at)} />
              <SummaryItem label="Updated" value={formatDateTime(job.updated_at)} />
              <SummaryItem label="Status" value={job.status} />
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

function TextCard({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {value || "-"}
        </p>
      </CardContent>
    </Card>
  );
}