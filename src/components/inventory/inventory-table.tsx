import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";

type InventoryRow = {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
};

export function InventoryTable({ items }: { items: InventoryRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No inventory items found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {items.map((item) => {
          const isLowStock = Number(item.current_quantity) <= Number(item.minimum_quantity);

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.item_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.item_code}
                  </p>
                </div>

                {isLowStock ? (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                    Low Stock
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="capitalize">Category: {item.category.replaceAll("_", " ")}</p>
                <p>
                  Quantity: {item.current_quantity} {item.unit}
                </p>
                <p>
                  Minimum: {item.minimum_quantity} {item.unit}
                </p>
                <p>Unit Cost: {formatCurrency(item.unit_cost)}</p>
              </div>

              <div className="mt-4">
                <Link
                  href={`/inventory/${item.id}`}
                  className="text-sm font-medium text-slate-900 underline underline-offset-4"
                >
                  View Item
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Minimum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isLowStock =
                  Number(item.current_quantity) <= Number(item.minimum_quantity);

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-medium text-slate-900">{item.item_name}</div>
                      <div className="text-xs text-slate-500">{item.item_code}</div>
                    </td>
                    <td className="px-4 py-4 text-sm capitalize text-slate-600">
                      {item.category.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.current_quantity} {item.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.minimum_quantity} {item.unit}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {isLowStock ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}