import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatUserDate } from "@/lib/preferences/format";
import { getCurrentUserPreferences } from "@/lib/preferences/user-preferences";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentSignatureBlock,
  DocumentStatusStamp,
  DocumentTable,
} from "@/components/shared/document-primitives";

type GoodsReceivedNotePageProps = {
  params: Promise<{ id: string }>;
};

type RestockRow = {
  id: string;
  restock_number: string;
  status: string;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  reference: string | null;
  supplier: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
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
  const profile = await requireProfile();
  const preferences = await getCurrentUserPreferences(profile.id);
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
        supplier:suppliers(company_name, contact_person, email, phone)
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
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const statusTone = order.status === "received" ? "success" : "warning";

  return (
    <DocumentShell
      title="Goods Received Note"
      documentNumber={order.restock_number}
    >
      <div className="space-y-9">
        <section className="document-avoid-break grid gap-8 border-y border-slate-950 py-6 md:grid-cols-[1fr_0.85fr] print:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Goods Received Note
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-950">
              {order.restock_number}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Inventory receiving confirmation for goods supplied by{" "}
              {order.supplier?.company_name || "supplier"}. Quantities shown are
              sourced from the recorded restock order items.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end print:items-end">
            <DocumentStatusStamp
              status={order.status.replace("_", " ")}
              tone={statusTone}
            />
            <div className="w-full border border-slate-200 p-4 md:max-w-xs print:max-w-xs">
              <DocumentInfoRow
                label="Received Date"
                value={formatUserDate(order.received_date, preferences)}
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
            </div>
          </DocumentSection>

          <DocumentSection title="Receipt Details">
            <div className="grid gap-4 border border-slate-200 p-5 sm:grid-cols-2 print:grid-cols-2">
              <DocumentInfoRow label="Restock No." value={order.restock_number} />
              <DocumentInfoRow label="Status" value={order.status.replace("_", " ")} />
              <DocumentInfoRow
                label="Order Date"
                value={formatUserDate(order.order_date, preferences)}
              />
              <DocumentInfoRow
                label="Expected Date"
                value={formatUserDate(order.expected_date, preferences)}
              />
              <DocumentInfoRow
                label="Received Date"
                value={formatUserDate(order.received_date, preferences)}
              />
              <DocumentInfoRow label="Total Quantity" value={totalQuantity} />
            </div>
          </DocumentSection>
        </section>

        <DocumentSection
          title="Received Items"
          description="Inventory items recorded against this goods received note."
        >
          {items.length > 0 ? (
            <DocumentTable>
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Item</th>
                  <th>Code</th>
                  <th className="text-right">Quantity Received</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td className="font-medium text-slate-950">
                      {item.inventory_item?.item_name || "-"}
                    </td>
                    <td>{item.inventory_item?.item_code || "-"}</td>
                    <td className="text-right font-semibold text-slate-950">
                      {item.quantity} {item.inventory_item?.unit || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentTable>
          ) : (
            <p className="border border-slate-200 p-4 text-sm text-slate-600">
              No received items were found for this goods received note.
            </p>
          )}
        </DocumentSection>

        <DocumentSection title="Inventory Confirmation">
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            This document confirms the quantities recorded on the restock order
            for inventory receipt. Stock posting and inventory balances remain
            governed by the existing restocking workflow and database records.
          </div>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Received / Checked By"
          rightLabel="Supplier Representative"
        />
      </div>
    </DocumentShell>
  );
}
