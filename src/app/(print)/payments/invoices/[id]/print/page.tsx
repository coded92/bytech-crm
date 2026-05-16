import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanySettings } from "@/lib/company/get-company-settings";
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
  PaymentInstructionsBlock,
} from "@/components/shared/document-primitives";

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
  billing_period_start: string | null;
  billing_period_end: string | null;
  reference: string | null;
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
  const settings = await getCompanySettings();

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
  const billingPeriod = formatBillingPeriod(
    invoice.billing_period_start,
    invoice.billing_period_end
  );
  const invoiceTypeLabel = invoice.invoice_type.replaceAll("_", " ");
  const paymentReference = invoice.reference || invoice.invoice_number;

  return (
    <DocumentShell title="Invoice" documentNumber={invoice.invoice_number}>
      <div className="space-y-8">
        <section className="document-avoid-break grid gap-8 md:grid-cols-[1fr_0.9fr] print:grid-cols-[1fr_0.9fr]">
          <div className="border-l-4 border-slate-950 pl-5">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Balance Due
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-950">
              {formatCurrency(invoice.balance)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Due {formatDate(invoice.due_date)}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end print:items-end">
            <DocumentStatusStamp
              status={invoice.status.replaceAll("_", " ")}
              tone={getInvoiceStatusTone(invoice.status)}
            />
            <p className="text-right text-sm capitalize text-slate-600">
              {invoiceTypeLabel} invoice
            </p>
          </div>
        </section>

        <section className="document-avoid-break grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Bill To
            </h3>
            <div className="mt-4 space-y-3">
              <p className="text-base font-semibold text-slate-950">
                {invoice.customer?.company_name || "-"}
              </p>
              <DocumentInfoRow
                label="Contact"
                value={invoice.customer?.contact_person || "-"}
              />
              <DocumentInfoRow label="Email" value={invoice.customer?.email || "-"} />
              <DocumentInfoRow label="Phone" value={invoice.customer?.phone || "-"} />
              <DocumentInfoRow
                label="Address"
                value={invoice.customer?.address || "-"}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-5">
            <h3 className="text-sm font-semibold uppercase text-slate-950">
              Invoice Details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <DocumentInfoRow label="Invoice No." value={invoice.invoice_number} />
              <DocumentInfoRow
                label="Invoice Date"
                value={formatDate(invoice.created_at)}
              />
              <DocumentInfoRow
                label="Payment Due"
                value={formatDate(invoice.due_date)}
              />
              <DocumentInfoRow
                label="Quotation Ref"
                value={invoice.quotation?.quote_number ?? "-"}
              />
              <DocumentInfoRow
                label="Billing Period"
                value={billingPeriod}
              />
              <DocumentInfoRow
                label="Payment Ref"
                value={paymentReference}
              />
            </div>
          </div>
        </section>

        <DocumentSection title="Invoice Items">
          <DocumentTable>
            <thead>
              <tr className="bg-slate-950 text-white">
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
              {quotationItems.length > 0 ? (
                quotationItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-slate-950">
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
              ) : (
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-4 capitalize text-slate-950">
                    {invoiceTypeLabel} invoice
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
          </DocumentTable>
        </DocumentSection>

        <DocumentTotals
          rows={[
            { label: "Invoice Total", value: formatCurrency(invoice.amount) },
            { label: "Amount Paid", value: formatCurrency(invoice.amount_paid) },
            {
              label: "Balance Due",
              value: formatCurrency(invoice.balance),
              strong: true,
            },
          ]}
        />

        <PaymentInstructionsBlock
          instructions={
            <p>
              Please use the invoice number or payment reference when making
              payment. Contact {settings.company_name}
              {settings.email ? ` at ${settings.email}` : ""}
              {settings.phone ? ` or ${settings.phone}` : ""} for approved
              payment channels.
            </p>
          }
          reference={paymentReference}
        />

        <DocumentSection title="Commercial Notes / Terms">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {invoice.notes ||
              "Payment is due by the date stated on this invoice. Please quote the invoice number on all payment correspondence."}
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          leftLabel="Authorized by"
          rightLabel="Received by customer"
        />
      </div>
    </DocumentShell>
  );
}

function getInvoiceStatusTone(status: InvoiceRow["status"]) {
  if (status === "paid" || status === "waived") return "success";
  if (status === "partial") return "warning";
  if (status === "overdue") return "danger";
  return "neutral";
}

function formatBillingPeriod(start: string | null, end: string | null) {
  if (start && end) {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (start) {
    return `From ${formatDate(start)}`;
  }

  if (end) {
    return `Until ${formatDate(end)}`;
  }

  return "-";
}
