import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";

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
    supabase.from("quotations").select("*").eq("id", id).maybeSingle(),
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
    <DocumentShell title="Quotation" documentNumber={quotation.quote_number}>
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2 print:grid-cols-2">

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-950">
              Quotation To
            </h3>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">
                {quotation.company_name}
              </p>
              <p>{quotation.contact_person || "-"}</p>
              <p>{quotation.email || "-"}</p>
              <p>{quotation.phone || "-"}</p>
              <p className="whitespace-pre-wrap">{quotation.address || "-"}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <InfoRow label="Quote Number" value={quotation.quote_number} />
            <InfoRow label="Quote Date" value={formatDate(quotation.created_at)} />
            <InfoRow label="Valid Until" value={formatDate(quotation.valid_until)} />
            <InfoRow label="Status" value={quotation.status.replaceAll("_", " ")} />
            <InfoRow
              label="Total (NGN)"
              value={formatCurrency(quotation.total)}
              strong
            />
          </div>
        </div>

        <div className="overflow-hidden border border-slate-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                  Items
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                  Quantity
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-sm text-slate-900">
                      <p className="font-semibold">{item.item_name}</p>
                      {item.description ? (
                        <p className="mt-1 whitespace-pre-wrap text-slate-600">
                          {item.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {itemsError ? (
          <p className="text-sm text-red-600">
            Failed to load items: {itemsError.message}
          </p>
        ) : null}

        <div className="ml-auto w-full max-w-sm space-y-3 text-sm">
          <SummaryRow label="Subtotal" value={formatCurrency(quotation.subtotal)} />
          <SummaryRow label="Discount" value={formatCurrency(quotation.discount)} />
          <SummaryRow label="Tax" value={formatCurrency(quotation.tax)} />
          <SummaryRow label="Total" value={formatCurrency(quotation.total)} strong />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-950">Notes / Terms</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {quotation.notes || "-"}
          </p>
        </div>
      </div>
    </DocumentShell>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value?: string | number | null;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-slate-600">{label}:</span>
      <span
        className={
          strong
            ? "text-right text-base font-bold text-slate-950"
            : "text-right font-medium text-slate-950"
        }
      >
        {value ?? "-"}
      </span>
    </div>
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
    <div
      className={
        strong
          ? "flex justify-between border-t border-slate-300 pt-3 text-base font-bold text-slate-950"
          : "flex justify-between text-slate-700"
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}