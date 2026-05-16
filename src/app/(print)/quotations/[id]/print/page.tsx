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
  created_by: string | null;
};

type QuotationItemRow = {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type PreparedByRow = {
  full_name: string | null;
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
  const items = normalizeQuotationItemsForPrint(
    (itemsData ?? []) as QuotationItemRow[]
  );

  const { data: preparedByData } = quotation.created_by
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", quotation.created_by)
        .maybeSingle()
    : { data: null };

  const preparedBy = preparedByData as PreparedByRow | null;
  const statusLabel = quotation.status.replaceAll("_", " ");
  const validUntil = formatDate(quotation.valid_until);

  return (
    <DocumentShell title="Quotation" documentNumber={quotation.quote_number}>
      <div className="space-y-8">
        <section className="document-avoid-break grid gap-8 md:grid-cols-[1fr_0.9fr] print:grid-cols-[1fr_0.9fr]">
          <div className="border-l-4 border-slate-950 pl-5">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Proposal Value
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-950">
              {formatCurrency(quotation.total)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Valid until {validUntil}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end print:items-end">
            <DocumentStatusStamp
              status={statusLabel}
              tone={getQuotationStatusTone(quotation.status)}
            />
            <p className="text-right text-sm text-slate-600">
              Customer quotation and commercial proposal
            </p>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Prepared For
            </h3>
            <div className="mt-4 space-y-3">
              <p className="text-base font-semibold text-slate-950">
                {quotation.company_name}
              </p>
              <DocumentInfoRow
                label="Contact"
                value={quotation.contact_person || "-"}
              />
              <DocumentInfoRow label="Email" value={quotation.email || "-"} />
              <DocumentInfoRow label="Phone" value={quotation.phone || "-"} />
              <DocumentInfoRow label="Address" value={quotation.address || "-"} />
            </div>
          </div>

          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Quotation Details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <DocumentInfoRow label="Quote No." value={quotation.quote_number} />
              <DocumentInfoRow
                label="Quote Date"
                value={formatDate(quotation.created_at)}
              />
              <DocumentInfoRow label="Valid Until" value={validUntil} />
              <DocumentInfoRow label="Status" value={statusLabel} />
              <DocumentInfoRow
                label="Prepared By"
                value={preparedBy?.full_name || "-"}
              />
              <DocumentInfoRow
                label="Proposal Total"
                value={formatCurrency(quotation.total)}
              />
            </div>
          </div>
        </section>

        <DocumentSection title="Proposed Items">
          <DocumentTable>
            <thead>
              <tr className="bg-slate-950 text-white">
                <th className="w-14 px-4 py-3 text-left text-xs font-semibold uppercase">
                  No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 align-top text-sm font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 align-top text-slate-950">
                      <p className="font-semibold">{item.item_name}</p>
                      {item.description ? (
                        <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">
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
          </DocumentTable>
        </DocumentSection>

        {itemsError ? (
          <p className="text-sm text-red-600">
            Failed to load items: {itemsError.message}
          </p>
        ) : null}

        <DocumentTotals
          rows={[
            { label: "Subtotal", value: formatCurrency(quotation.subtotal) },
            { label: "Discount", value: formatCurrency(quotation.discount) },
            { label: "Tax", value: formatCurrency(quotation.tax) },
            {
              label: "Quotation Total",
              value: formatCurrency(quotation.total),
              strong: true,
            },
          ]}
        />

        <DocumentSection title="Notes / Commercial Terms">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {quotation.notes ||
              "This quotation is subject to availability and remains valid until the date stated above. Acceptance may be confirmed by signing below or issuing an approved purchase instruction."}
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Prepared / authorized by"
          rightLabel="Customer acceptance"
        />
      </div>
    </DocumentShell>
  );
}

function getQuotationStatusTone(status: string) {
  if (status === "accepted") return "success";
  if (status === "sent" || status === "draft") return "neutral";
  if (status === "expired") return "warning";
  return "danger";
}

function normalizeQuotationItemsForPrint(items: QuotationItemRow[]) {
  const seen = new Set<string>();
  const normalizedItems: QuotationItemRow[] = [];

  for (const item of items) {
    const key = JSON.stringify({
      item_name: item.item_name.trim(),
      description: (item.description || "").trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price),
    });

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalizedItems.push(item);
  }

  return normalizedItems;
}
