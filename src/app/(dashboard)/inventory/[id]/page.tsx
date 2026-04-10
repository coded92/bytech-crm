import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { StockMovementForm } from "@/components/inventory/stock-movement-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InventoryDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type ItemRow = {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  sku: string | null;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type MovementRow = {
  id: string;
  movement_type: "stock_in" | "stock_out" | "adjustment";
  quantity: number;
  unit_cost: number | null;
  note: string | null;
  created_at: string;
  field_job: {
    job_number: string | null;
  } | null;
};

type FieldJobOption = {
  id: string;
  job_number: string;
};

export default async function InventoryDetailsPage({
  params,
}: InventoryDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: itemData }, { data: movementsData }, { data: fieldJobsData }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select(`
          id,
          item_code,
          item_name,
          category,
          sku,
          unit,
          current_quantity,
          minimum_quantity,
          unit_cost,
          notes,
          created_at,
          updated_at
        `)
        .eq("id", id)
        .maybeSingle(),

      supabase
        .from("inventory_movements")
        .select(`
          id,
          movement_type,
          quantity,
          unit_cost,
          note,
          created_at,
          field_job:field_jobs(job_number)
        `)
        .eq("inventory_item_id", id)
        .order("created_at", { ascending: false }),

      supabase
        .from("field_jobs")
        .select("id, job_number")
        .order("created_at", { ascending: false }),
    ]);

  if (!itemData) {
    notFound();
  }

  const item = itemData as ItemRow;
  const movements = (movementsData ?? []) as MovementRow[];
  const fieldJobs = (fieldJobsData ?? []) as FieldJobOption[];

  const isLowStock =
    Number(item.current_quantity) <= Number(item.minimum_quantity);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {item.item_name}
          </h2>
          <p className="text-slate-600">{item.item_code}</p>
        </div>

        <div>
          {isLowStock ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Low Stock
            </span>
          ) : (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              In Stock
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Item Code" value={item.item_code} />
              <InfoItem label="Item Name" value={item.item_name} />
              <InfoItem label="Category" value={item.category.replaceAll("_", " ")} />
              <InfoItem label="SKU" value={item.sku || "-"} />
              <InfoItem label="Current Quantity" value={`${item.current_quantity} ${item.unit}`} />
              <InfoItem label="Minimum Quantity" value={`${item.minimum_quantity} ${item.unit}`} />
              <InfoItem label="Unit Cost" value={formatCurrency(item.unit_cost)} />
              <InfoItem label="Updated At" value={formatDateTime(item.updated_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {item.notes || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {movements.length === 0 ? (
                <p className="text-sm text-slate-500">No movements recorded yet.</p>
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-900">
                          {movement.movement_type.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty: {movement.quantity}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Job: {movement.field_job?.job_number || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Note: {movement.note || "-"}
                        </p>
                      </div>

                      <p className="text-sm text-slate-500">
                        {formatDateTime(movement.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Record Stock Movement</CardTitle>
            </CardHeader>

            <CardContent>
              <StockMovementForm
                inventoryItemId={item.id}
                fieldJobs={fieldJobs}
              />
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
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value}</p>
    </div>
  );
}