import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentSignatureBlock,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

type FieldServiceReportPageProps = {
  params: Promise<{ id: string }>;
};

type JobRow = {
  id: string;
  job_number: string;
  title: string;
  job_type: string;
  priority: string;
  status: string;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  checked_in_at: string | null;
  work_started_at: string | null;
  work_completed_at: string | null;
  checked_out_at: string | null;
  reported_issue: string | null;
  work_done: string | null;
  materials_used: string | null;
  recommendation: string | null;
  customer_feedback: string | null;
  created_at: string;
  customer: {
    company_name: string | null;
  } | null;
  branch: {
    branch_name: string | null;
  } | null;
  asset: {
    asset_tag: string | null;
  } | null;
  assigned_engineer: {
    full_name: string | null;
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

type InventoryUsageRow = {
  id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
  inventory_item: {
    item_name: string | null;
    item_code: string | null;
    unit: string | null;
  } | null;
};

type PhotoRow = {
  id: string;
  photo_type: "before" | "after" | "inspection" | "materials" | "other";
  caption: string | null;
};

export default async function FieldServiceReportPage({
  params,
}: FieldServiceReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: jobData },
    { data: materialsData },
    { data: inventoryUsageData },
    { data: photosData },
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
          checked_in_at,
          work_started_at,
          work_completed_at,
          checked_out_at,
          reported_issue,
          work_done,
          materials_used,
          recommendation,
          customer_feedback,
          created_at,
          customer:customers(company_name),
          branch:customer_branches(branch_name),
          asset:assets(asset_tag),
          assigned_engineer:profiles!field_jobs_assigned_engineer_id_fkey(full_name)
        `)
        .eq("id", id)
        .maybeSingle(),

      supabase
        .from("field_job_materials")
        .select("id, item_name, quantity, unit, unit_cost, total_cost, notes")
        .eq("field_job_id", id)
        .order("created_at", { ascending: true }),

      supabase
        .from("field_job_inventory_usage")
        .select(`
          id,
          quantity,
          unit_cost,
          total_cost,
          notes,
          inventory_item:inventory_items(item_name, item_code, unit)
        `)
        .eq("field_job_id", id)
        .order("created_at", { ascending: true }),

      supabase
        .from("field_job_photos")
        .select("id, photo_type, caption")
        .eq("field_job_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!jobData) {
    notFound();
  }

  const job = jobData as JobRow;
  const materials = (materialsData ?? []) as MaterialRow[];
  const inventoryUsages = (inventoryUsageData ?? []) as InventoryUsageRow[];
  const photos = (photosData ?? []) as PhotoRow[];

  const totalMaterialsCost = materials.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const totalInventoryUsageCost = inventoryUsages.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );
  const totalServiceCost = totalMaterialsCost + totalInventoryUsageCost;
  const photoSummary = summarizePhotos(photos);
  const statusLabel = job.status.replaceAll("_", " ");
  const serviceWindow = formatServiceWindow(job.started_at, job.completed_at);

  return (
    <DocumentShell
      title="Field Service Report"
      documentNumber={job.job_number}
    >
      <div className="space-y-8">
        <section className="document-avoid-break grid gap-8 md:grid-cols-[1fr_0.9fr] print:grid-cols-[1fr_0.9fr]">
          <div className="border-l-4 border-slate-950 pl-5">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Service Completion Report
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {job.title}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {job.customer?.company_name || "Customer"} | {job.job_number}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end print:items-end">
            <DocumentStatusStamp
              status={statusLabel}
              tone={getFieldJobStatusTone(job.status)}
            />
            <p className="text-right text-sm capitalize text-slate-600">
              {job.priority} priority | {job.job_type.replaceAll("_", " ")}
            </p>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Customer / Site
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Customer"
                value={job.customer?.company_name || "-"}
              />
              <DocumentInfoRow
                label="Branch"
                value={job.branch?.branch_name || "-"}
              />
              <DocumentInfoRow
                label="Asset"
                value={job.asset?.asset_tag || "-"}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Job Metadata
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <DocumentInfoRow label="Job No." value={job.job_number} />
              <DocumentInfoRow
                label="Job Type"
                value={job.job_type.replaceAll("_", " ")}
              />
              <DocumentInfoRow
                label="Engineer"
                value={job.assigned_engineer?.full_name || "-"}
              />
              <DocumentInfoRow label="Priority" value={job.priority} />
              <DocumentInfoRow label="Status" value={statusLabel} />
              <DocumentInfoRow
                label="Scheduled"
                value={formatDate(job.scheduled_date)}
              />
            </div>
          </div>
        </section>

        <DocumentSection title="Work Timeline">
          <div className="border border-slate-200 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <DocumentInfoRow
                label="Started"
                value={formatDateTime(job.started_at)}
              />
              <DocumentInfoRow
                label="Completed"
                value={formatDateTime(job.completed_at)}
              />
              <DocumentInfoRow
                label="Checked In"
                value={formatDateTime(job.checked_in_at)}
              />
              <DocumentInfoRow
                label="Checked Out"
                value={formatDateTime(job.checked_out_at)}
              />
              <DocumentInfoRow
                label="Work Started"
                value={formatDateTime(job.work_started_at)}
              />
              <DocumentInfoRow
                label="Work Completed"
                value={formatDateTime(job.work_completed_at)}
              />
              <DocumentInfoRow label="Service Window" value={serviceWindow} />
              <DocumentInfoRow
                label="Report Created"
                value={formatDateTime(job.created_at)}
              />
            </div>
          </div>
        </DocumentSection>

        <DocumentSection title="Reported Issue / Purpose">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.reported_issue || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Work Completed">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.work_done || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Recommendations / Next Step">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.recommendation || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Customer Feedback">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.customer_feedback || "-"}
          </p>
        </DocumentSection>

        <DocumentSection
          title="Inventory Issued"
          description="Stock-controlled inventory issued to this field job."
        >
          {inventoryUsages.length === 0 ? (
            <div className="border border-slate-200 p-5 text-sm text-slate-500">
              No inventory usage recorded.
            </div>
          ) : (
            <DocumentTable>
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventoryUsages.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                      {item.inventory_item?.item_name || "-"}
                      {item.notes ? (
                        <p className="mt-1 font-normal leading-6 text-slate-600">
                          {item.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.inventory_item?.item_code || "-"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {item.quantity} {item.inventory_item?.unit || ""}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                      {formatCurrency(item.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          )}
        </DocumentSection>

        <DocumentSection
          title="Manual Materials / Parts"
          description="Materials manually recorded against this job outside stock-controlled inventory."
        >
          {materials.length === 0 ? (
            <div className="border border-slate-200 p-5 text-sm text-slate-500">
              No manual materials recorded.
            </div>
          ) : (
            <DocumentTable>
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {materials.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                      {item.item_name}
                      {item.notes ? (
                        <p className="mt-1 font-normal leading-6 text-slate-600">
                          {item.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                      {formatCurrency(item.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          )}
        </DocumentSection>

        <DocumentTotals
          rows={[
            {
              label: "Inventory Issued Cost",
              value: formatCurrency(totalInventoryUsageCost),
            },
            {
              label: "Manual Materials Cost",
              value: formatCurrency(totalMaterialsCost),
            },
            {
              label: "Total Recorded Materials Cost",
              value: formatCurrency(totalServiceCost),
              strong: true,
            },
          ]}
        />

        <DocumentSection title="Materials Summary">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {job.materials_used || "-"}
          </p>
        </DocumentSection>

        <DocumentSection title="Photo Evidence">
          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <div className="border border-slate-200 p-5">
              <DocumentInfoRow label="Photos Attached" value={photos.length} />
            </div>
            <div className="border border-slate-200 p-5">
              <DocumentInfoRow label="Photo Types" value={photoSummary} />
            </div>
          </div>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Engineer sign-off"
          rightLabel="Customer acknowledgment"
        />
      </div>
    </DocumentShell>
  );
}

function getFieldJobStatusTone(status: string) {
  if (status === "completed") return "success";
  if (status === "awaiting_parts") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

function summarizePhotos(photos: PhotoRow[]) {
  if (photos.length === 0) {
    return "-";
  }

  const summary = photos.reduce<Record<string, number>>((acc, photo) => {
    const label = photo.photo_type.replaceAll("_", " ");
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(summary)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");
}

function formatServiceWindow(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) {
    return "-";
  }

  const started = new Date(startedAt);
  const completed = new Date(completedAt);
  const diffMs = completed.getTime() - started.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "-";
  }

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}
