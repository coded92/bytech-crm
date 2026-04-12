import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type PurchaseOrderPageProps = {
  params: Promise<{ id: string }>;
};

type RestockRow = {
  id: string;
  restock_number: string;
  order_date: string;
  expected_date: string | null;
  reference: string | null;
  notes: string | null;
  total_amount: number;
  supplier: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
};

type RestockItemRow = {
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

export default async function PurchaseOrderPage({
  params,
}: PurchaseOrderPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orderData }, { data: itemsData }] = await Promise.all([
    supabase
      .from("inventory_restock_orders")
      .select(`
        id,
        restock_number,
        order_date,
        expected_date,
        reference,
        notes,
        total_amount,
        supplier:suppliers(
          company_name,
          contact_person,
          email,
          phone,
          address
        )
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("inventory_restock_order_items")
      .select(`
        id,
        quantity,
        unit_cost,
        total_cost,
        notes,
        inventory_item:inventory_items(item_name, item_code, unit)
      `)
      .eq("restock_order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!orderData) {
    notFound();
  }

  const order = orderData as RestockRow;
  const items = (itemsData ?? []) as RestockItemRow[];

  return (
    <DocumentShell
      title="Purchase Order"
      documentNumber={order.restock_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Supplier</h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Company"
                value={order.supplier?.company_name || "-"}
              />
              <DocumentInfoRow
                label="Contact"
                value={order.supplier?.contact_person || "-"}
              />
              <DocumentInfoRow
                label="Email"
                value={order.supplier?.email || "-"}
              />
              <DocumentInfoRow
                label="Phone"
                value={order.supplier?.phone || "-"}
              />
              <DocumentInfoRow
                label="Address"
                value={order.supplier?.address || "-"}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Order Info</h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Order Date"
                value={formatDate(order.order_date)}
              />
              <DocumentInfoRow
                label="Expected Date"
                value={formatDate(order.expected_date)}
              />
              <DocumentInfoRow
                label="Reference"
                value={order.reference || "-"}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Ordered Items
          </h3>

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
                {items.map((item) => (
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
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {order.notes || "-"}
          </p>
        </div>
      </div>
    </DocumentShell>
  );
}