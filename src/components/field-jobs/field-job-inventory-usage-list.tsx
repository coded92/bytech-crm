import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";

type UsageRow = {
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

export function FieldJobInventoryUsageList({
  usages,
}: {
  usages: UsageRow[];
}) {
  if (usages.length === 0) {
    return <p className="text-sm text-slate-500">No inventory issued yet.</p>;
  }

  return (
    <div className="space-y-3">
      {usages.map((usage) => (
        <div
          key={usage.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {usage.inventory_item?.item_name || "-"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {usage.inventory_item?.item_code || "-"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Qty: {usage.quantity} {usage.inventory_item?.unit || ""}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Unit Cost: {formatCurrency(usage.unit_cost)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Notes: {usage.notes || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {formatDateTime(usage.created_at)}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(usage.total_cost)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}