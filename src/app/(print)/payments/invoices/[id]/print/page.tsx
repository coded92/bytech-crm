import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";

type PrintInvoicePageProps = {
  params: Promise<{ id: string }>;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  quotation_id: string | null;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  created_at: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  notes: string | null;
  customer?: {
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  quotation?: {
    quote_number: string | null;
  } | null;
};

type QuotationItemRow = {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export default async function PrintInvoicePage({
  params,
}: PrintInvoicePageProps) {
  const { id } = await params;

  if (!id || id === "undefined") {
    notFound();
  }

  const supabase = await createClient();

  const { data: invoiceData, error } = await supabase
    .from("payment_invoices")
    .select(`
      *,
      customer:customers(company_name, contact_person, email, phone, address),
      quotation:quotations(quote_number)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load invoice print page: {error.message}
      </div>
    );
  }

  if (!invoiceData) {
    notFound();
  }

  const invoice = invoiceData as InvoiceRow;

  const { data: quotationItemsData } = invoice.quotation_id
    ? await supabase
        .from("quotation_items")
        .select("*")
        .eq("quotation_id", invoice.quotation_id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const quotationItems = (quotationItemsData ?? []) as QuotationItemRow[];

  return (
    <DocumentShell title="Invoice" documentNumber={invoice.invoice_number}>
      <div className="space-y-8">
        <div className="invoice-header grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-950">
              Bill To
            </h3>

            <div className="mt-3 space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">
                {invoice.customer?.company_name || "-"}
              </p>
              <p>{invoice.customer?.contact_person || "-"}</p>
              <p>{invoice.customer?.email || "-"}</p>
              <p>{invoice.customer?.phone || "-"}</p>
              <p className="whitespace-pre-wrap">
                {invoice.customer?.address || "-"}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <InfoRow label="Invoice Number" value={invoice.invoice_number} />
            <InfoRow label="Invoice Date" value={formatDate(invoice.created_at)} />
            <InfoRow label="Payment Due" value={formatDate(invoice.due_date)} />
            <InfoRow
              label="Quotation Ref"
              value={invoice.quotation?.quote_number ?? "-"}
            />
            <InfoRow label="Status" value={invoice.status.replaceAll("_", " ")} />
            <InfoRow
              label="Amount Due (NGN)"
              value={formatCurrency(invoice.balance)}
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
              {quotationItems.length > 0 ? (
                quotationItems.map((item) => (
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
              ) : (
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-4 text-sm text-slate-900 capitalize">
                    {invoice.invoice_type.replaceAll("_", " ")} invoice
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700">
                    1
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                    {formatCurrency(invoice.amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-sm space-y-3 text-sm">
          <SummaryRow
            label="Total"
            value={formatCurrency(invoice.amount)}
          />
          <SummaryRow
            label="Amount Paid"
            value={formatCurrency(invoice.amount_paid)}
          />
          <SummaryRow
            label="Amount Due (NGN)"
            value={formatCurrency(invoice.balance)}
            strong
          />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-950">Notes / Terms</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {invoice.notes || "-"}
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