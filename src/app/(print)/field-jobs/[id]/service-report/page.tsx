import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

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

export default async function FieldServiceReportPage({
  params,
}: FieldServiceReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: jobData }, { data: materialsData }, { data: inventoryUsageData }] =
    await Promise.all([
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
    ]);

  if (!jobData) {
    notFound();
  }

  const job = jobData as JobRow;
  const materials = (materialsData ?? []) as MaterialRow[];
  const inventoryUsages = (inventoryUsageData ?? []) as InventoryUsageRow[];

  const totalMaterialsCost = materials.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  const totalInventoryUsageCost = inventoryUsages.reduce(
    (sum, item) => sum + Number(item.total_cost || 0),
    0
  );

  return (
    <DocumentShell
      title="Field Service Report"
      documentNumber={job.job_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Job Information
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow label="Job Title" value={job.title} />
              <DocumentInfoRow
                label="Customer"
                value={job.customer?.company_name || "-"}
              />
              <DocumentInfoRow
                label="Branch"
                value={job.branch?.branch_name || "-"}
              />
              <DocumentInfoRow
                label="Engineer"
                value={job.assigned_engineer?.full_name || "-"}
              />
              <DocumentInfoRow
                label="Asset"
                value={job.asset?.asset_tag || "-"}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Schedule & Status
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Job Type"
                value={job.job_type.replaceAll("_", " ")}
              />
              <DocumentInfoRow label="Priority" value={job.priority} />
              <DocumentInfoRow label="Status" value={job.status} />
              <DocumentInfoRow
                label="Scheduled Date"
                value={formatDate(job.scheduled_date)}
              />
              <DocumentInfoRow
                label="Started At"
                value={formatDateTime(job.started_at)}
              />
              <DocumentInfoRow
                label="Completed At"
                value={formatDateTime(job.completed_at)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Engineer Time Tracking
          </h3>
          <div className="mt-4 space-y-3">
            <DocumentInfoRow
              label="Checked In"
              value={formatDateTime(job.checked_in_at)}
            />
            <DocumentInfoRow
              label="Work Started"
              value={formatDateTime(job.work_started_at)}
            />
            <DocumentInfoRow
              label="Work Completed"
              value={formatDateTime(job.work_completed_at)}
            />
            <DocumentInfoRow
              label="Checked Out"
              value={formatDateTime(job.checked_out_at)}
            />
          </div>
        </div>

        <Section title="Reported Issue / Purpose" value={job.reported_issue} />
        <Section title="Work Done" value={job.work_done} />
        <Section title="Materials Used (Summary)" value={job.materials_used} />
        <Section title="Recommendation / Next Step" value={job.recommendation} />
        <Section title="Customer Feedback" value={job.customer_feedback} />

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Manual Materials / Parts Used
          </h3>

          {materials.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
              No manual materials recorded.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {materials.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {item.item_name}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.quantity} {item.unit || ""}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(item.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-sm font-semibold text-slate-700"
                    >
                      Total Manual Materials Cost
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(totalMaterialsCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Actual Inventory Issued to Job
          </h3>

          {inventoryUsages.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
              No inventory usage recorded.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {inventoryUsages.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {item.inventory_item?.item_name || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.inventory_item?.item_code || "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.quantity} {item.inventory_item?.unit || ""}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatCurrency(item.unit_cost)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(item.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-slate-50">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right text-sm font-semibold text-slate-700"
                    >
                      Total Inventory Usage Cost
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(totalInventoryUsageCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </DocumentShell>
  );
}

function Section({
  title,
  value,
}: {
  title: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}