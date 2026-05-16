import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentSignatureBlock,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

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
  status: string;
  payment_status: string;
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
        status,
        payment_status,
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
  const statusTone = order.status === "cancelled" ? "danger" : "neutral";
  const itemTotal = items.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);

  return (
    <DocumentShell
      title="Purchase Order"
      documentNumber={order.restock_number}
    >
      <div className="space-y-9">
        <section className="document-avoid-break grid gap-8 border-y border-slate-950 py-6 md:grid-cols-[1fr_0.85fr] print:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Purchase Order
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-950">
              {formatCurrency(order.total_amount)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Procurement order issued to{" "}
              {order.supplier?.company_name || "supplier"} for inventory
              restocking. Values are sourced from the restock order and its
              recorded line items.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end print:items-end">
            <DocumentStatusStamp
              status={order.status.replace("_", " ")}
              tone={statusTone}
            />
            <div className="w-full border border-slate-200 p-4 md:max-w-xs print:max-w-xs">
              <DocumentInfoRow
                label="Payment Status"
                value={order.payment_status.replace("_", " ")}
              />
              <div className="mt-4">
                <DocumentInfoRow label="Reference" value={order.reference || "-"} />
              </div>
            </div>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <DocumentSection title="Supplier">
            <div className="space-y-4 border border-slate-200 p-5">
              <DocumentInfoRow
                label="Company"
                value={order.supplier?.company_name || "-"}
              />
              <DocumentInfoRow
                label="Contact"
                value={order.supplier?.contact_person || "-"}
              />
              <DocumentInfoRow label="Email" value={order.supplier?.email || "-"} />
              <DocumentInfoRow label="Phone" value={order.supplier?.phone || "-"} />
              <DocumentInfoRow
                label="Address"
                value={order.supplier?.address || "-"}
              />
            </div>
          </DocumentSection>

          <DocumentSection title="Order Details">
            <div className="grid gap-4 border border-slate-200 p-5 sm:grid-cols-2 print:grid-cols-2">
              <DocumentInfoRow
                label="PO / Restock No."
                value={order.restock_number}
              />
              <DocumentInfoRow label="Order Date" value={formatDate(order.order_date)} />
              <DocumentInfoRow
                label="Expected Date"
                value={formatDate(order.expected_date)}
              />
              <DocumentInfoRow label="Status" value={order.status.replace("_", " ")} />
              <DocumentInfoRow
                label="Payment Status"
                value={order.payment_status.replace("_", " ")}
              />
              <DocumentInfoRow label="Line Items" value={items.length} />
            </div>
          </DocumentSection>
        </section>

        <DocumentSection
          title="Ordered Items"
          description="Inventory items requested from the supplier."
        >
          {items.length > 0 ? (
            <DocumentTable>
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Item</th>
                  <th>Code</th>
                  <th>Quantity</th>
                  <th className="text-right">Unit Cost</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="font-medium text-slate-950">
                      {item.inventory_item?.item_name || "-"}
                      {item.notes ? (
                        <p className="mt-1 text-xs font-normal text-slate-500">
                          {item.notes}
                        </p>
                      ) : null}
                    </td>
                    <td>{item.inventory_item?.item_code || "-"}</td>
                    <td>
                      {item.quantity} {item.inventory_item?.unit || ""}
                    </td>
                    <td className="text-right">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="text-right font-semibold text-slate-950">
                      {formatCurrency(item.total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          ) : (
            <p className="border border-slate-200 p-4 text-sm text-slate-600">
              No ordered items were found for this purchase order.
            </p>
          )}
        </DocumentSection>

        <DocumentSection title="Order Total">
          <DocumentTotals
            rows={[
              { label: "Line Item Total", value: formatCurrency(itemTotal) },
              {
                label: "Purchase Order Total",
                value: formatCurrency(order.total_amount),
                strong: true,
              },
            ]}
          />
        </DocumentSection>

        <DocumentSection title="Notes / Terms">
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p className="whitespace-pre-wrap">
              {order.notes || "-"}
            </p>
          </div>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Prepared / Approved By"
          rightLabel="Supplier Acknowledgment"
        />
      </div>
    </DocumentShell>
  );
}
