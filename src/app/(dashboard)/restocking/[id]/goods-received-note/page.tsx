import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type GoodsReceivedNotePageProps = {
  params: Promise<{ id: string }>;
};

type RestockRow = {
  id: string;
  restock_number: string;
  status: string;
  order_date: string;
  received_date: string | null;
  supplier: {
    company_name: string | null;
    contact_person: string | null;
  } | null;
};

type RestockItemRow = {
  id: string;
  quantity: number;
  inventory_item: {
    item_name: string | null;
    item_code: string | null;
    unit: string | null;
  } | null;
};

export default async function GoodsReceivedNotePage({
  params,
}: GoodsReceivedNotePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: orderData }, { data: itemsData }] = await Promise.all([
    supabase
      .from("inventory_restock_orders")
      .select(`
        id,
        restock_number,
        status,
        order_date,
        received_date,
        supplier:suppliers(company_name, contact_person)
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("inventory_restock_order_items")
      .select(`
        id,
        quantity,
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
      title="Goods Received Note"
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
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">Receipt Info</h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Order Date"
                value={formatDate(order.order_date)}
              />
              <DocumentInfoRow
                label="Received Date"
                value={formatDate(order.received_date)}
              />
              <DocumentInfoRow label="Status" value={order.status} />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Received Items
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
                    Quantity Received
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-10 pt-8 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Received By</p>
            <div className="mt-10 border-t border-slate-300" />
          </div>

          <div>
            <p className="text-sm text-slate-500">Supplier Representative</p>
            <div className="mt-10 border-t border-slate-300" />
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}