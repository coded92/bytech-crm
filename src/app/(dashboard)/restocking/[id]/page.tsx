import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { RestockStatusForm } from "@/components/restocking/restock-status-form";
import { SupplierPaymentForm } from "@/components/restocking/supplier-payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RestockRow = {
  id: string;
  restock_number: string;
  status: "draft" | "ordered" | "received" | "cancelled";
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  reference: string | null;
  supplier_id: string | null;
  paid_amount: number;
  payment_status: "unpaid" | "part_paid" | "paid";
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

type SupplierRow = {
  id: string;
  company_name: string | null;
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
  } | null;
};

type RestockDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestockDetailsPage({
  params,
}: RestockDetailsPageProps) {
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
        expected_date,
        received_date,
        reference,
        supplier_id,
        paid_amount,
        payment_status,
        notes,
        total_amount,
        created_at,
        updated_at
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
        inventory_item:inventory_items(item_name, item_code)
      `)
      .eq("restock_order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!orderData) {
    notFound();
  }

  const order = orderData as RestockRow;
  const items = (itemsData ?? []) as RestockItemRow[];

  let supplier: SupplierRow | null = null;

  if (order.supplier_id) {
    const { data: supplierData } = await supabase
      .from("suppliers")
      .select("id, company_name")
      .eq("id", order.supplier_id)
      .maybeSingle();

    supplier = (supplierData as SupplierRow | null) ?? null;
  }

  const balanceDue = Math.max(
    0,
    Number(order.total_amount || 0) - Number(order.paid_amount || 0)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {order.restock_number}
        </h2>
        <p className="text-slate-600">{supplier?.company_name || "-"}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Restock Number" value={order.restock_number} />
              <InfoItem label="Supplier" value={supplier?.company_name || "-"} />
              <InfoItem label="Status" value={order.status} />
              <InfoItem label="Order Date" value={formatDate(order.order_date)} />
              <InfoItem
                label="Expected Date"
                value={order.expected_date ? formatDate(order.expected_date) : "-"}
              />
              <InfoItem
                label="Received Date"
                value={order.received_date ? formatDate(order.received_date) : "-"}
              />
              <InfoItem label="Reference" value={order.reference || "-"} />
              <InfoItem
                label="Total Amount"
                value={formatCurrency(order.total_amount)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Restock Items</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">No items found.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.inventory_item?.item_name || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.inventory_item?.item_code || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Notes: {item.notes || "-"}
                        </p>
                      </div>

                      <div className="text-right text-sm text-slate-600">
                        <p>Qty: {item.quantity}</p>
                        <p>Unit: {formatCurrency(item.unit_cost)}</p>
                        <p className="font-medium text-slate-900">
                          Total: {formatCurrency(item.total_cost)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {order.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>

            <CardContent>
              <RestockStatusForm
                orderId={order.id}
                currentStatus={order.status}
                currentReceivedDate={order.received_date}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Payable</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <SummaryItem
                label="Total Amount"
                value={formatCurrency(order.total_amount)}
              />
              <SummaryItem
                label="Paid Amount"
                value={formatCurrency(order.paid_amount)}
              />
              <SummaryItem
                label="Balance Due"
                value={formatCurrency(balanceDue)}
              />
              <SummaryItem
                label="Payment Status"
                value={order.payment_status}
              />

              {order.supplier_id ? (
                <SupplierPaymentForm
                  supplierId={order.supplier_id}
                  restockOrderId={order.id}
                  balanceDue={balanceDue}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  No supplier linked to this restock order.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Created"
                value={formatDateTime(order.created_at)}
              />
              <SummaryItem
                label="Updated"
                value={formatDateTime(order.updated_at)}
              />
              <SummaryItem label="Status" value={order.status} />
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

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">{value}</span>
    </div>
  );
}