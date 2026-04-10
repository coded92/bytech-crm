import { formatCurrency } from "@/lib/utils/format-currency";

type MaterialRow = {
  id: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  unit_cost: number;
  total_cost: number;
  notes: string | null;
};

export function FieldJobMaterialList({
  materials,
}: {
  materials: MaterialRow[];
}) {
  if (materials.length === 0) {
    return <p className="text-sm text-slate-500">No materials added yet.</p>;
  }

  return (
    <div className="space-y-3">
      {materials.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {item.item_name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Qty: {item.quantity} {item.unit || ""}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Unit Cost: {formatCurrency(item.unit_cost)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Notes: {item.notes || "-"}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {formatCurrency(item.total_cost)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}