import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type PrintQuotationPageProps = {
  params: Promise<{ id: string }>;
};

type QuotationRow = {
  id: string;
  quote_number: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  valid_until: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
};

type QuotationItemRow = {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export default async function PrintQuotationPage({
  params,
}: PrintQuotationPageProps) {
  const { id } = await params;

  if (!id || id === "undefined") {
    notFound();
  }

  const supabase = await createClient();

  const [
    { data: quotationData, error: quotationError },
    { data: itemsData, error: itemsError },
  ] = await Promise.all([
    supabase
      .from("quotations")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (quotationError) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load quotation print page: {quotationError.message}
      </div>
    );
  }

  if (!quotationData) {
    notFound();
  }

  const quotation = quotationData as QuotationRow;
  const items = (itemsData ?? []) as QuotationItemRow[];

  return (
    <DocumentShell
      title="Quotation"
      documentNumber={quotation.quote_number}
    >
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Quotation To
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow label="Company" value={quotation.company_name} />
              <DocumentInfoRow
                label="Contact Person"
                value={quotation.contact_person}
              />
              <DocumentInfoRow label="Email" value={quotation.email} />
              <DocumentInfoRow label="Phone" value={quotation.phone} />
              <DocumentInfoRow label="Address" value={quotation.address} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Document Details
            </h3>
            <div className="mt-4 space-y-3">
              <DocumentInfoRow
                label="Quote Number"
                value={quotation.quote_number}
              />
              <DocumentInfoRow label="Status" value={quotation.status} />
              <DocumentInfoRow
                label="Created At"
                value={formatDateTime(quotation.created_at)}
              />
              <DocumentInfoRow
                label="Valid Until"
                value={formatDate(quotation.valid_until)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Items
          </h3>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.description || "-"}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {itemsError ? (
            <p className="mt-3 text-sm text-red-600">
              Failed to load items: {itemsError.message}
            </p>
          ) : null}
        </div>

        <div className="ml-auto max-w-sm space-y-3 rounded-xl border border-slate-200 p-5">
          <SummaryRow label="Subtotal" value={formatCurrency(quotation.subtotal)} />
          <SummaryRow label="Discount" value={formatCurrency(quotation.discount)} />
          <SummaryRow label="Tax" value={formatCurrency(quotation.tax)} />
          <SummaryRow
            label="Total"
            value={formatCurrency(quotation.total)}
            strong
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {quotation.notes || "-"}
          </p>
        </div>
      </div>
    </DocumentShell>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>
        {label}
      </span>
      <span className={strong ? "text-lg font-bold text-slate-900" : "text-slate-900"}>
        {value}
      </span>
    </div>
  );
}