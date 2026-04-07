import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { QuotationStatusBadge } from "@/components/quotations/quotation-status-badge";
import { QuotationStatusForm } from "@/components/quotations/quotation-status-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ id: string }>;
};

type QuotationRow = {
  id: string;
  quote_number: string;
  lead_id: string | null;
  customer_id: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type QuotationItemRow = {
  id: string;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export default async function QuotationDetailsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quotationData }, { data: itemsData }] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).single(),
    supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const quotation = quotationData as QuotationRow | null;
  const items = (itemsData ?? []) as QuotationItemRow[];

  if (!quotation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {quotation.quote_number}
          </h2>
          <p className="text-slate-600">{quotation.company_name}</p>
        </div>

        <div className="flex items-center gap-3">
          <QuotationStatusBadge status={quotation.status} />

          {quotation.customer_id ? (
            <Button asChild>
              <Link
                href={`/payments/invoices/new?customerId=${quotation.customer_id}&quotationId=${quotation.id}`}
              >
                Create Invoice
              </Link>
            </Button>
          ) : null}

          {quotation.lead_id ? (
            <Button asChild variant="outline">
              <Link href={`/leads/${quotation.lead_id}`}>View Lead</Link>
            </Button>
          ) : null}

          {quotation.customer_id ? (
            <Button asChild variant="outline">
              <Link href={`/customers/${quotation.customer_id}`}>
                View Customer
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Quote Number" value={quotation.quote_number} />
              <InfoItem label="Company" value={quotation.company_name} />
              <InfoItem label="Contact Person" value={quotation.contact_person} />
              <InfoItem label="Email" value={quotation.email} />
              <InfoItem label="Phone" value={quotation.phone} />
              <InfoItem
                label="Valid Until"
                value={formatDate(quotation.valid_until)}
              />
              <InfoItem label="Status" value={quotation.status} />
              <InfoItem label="Address" value={quotation.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <div className="text-sm text-slate-500">No items found.</div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.item_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.description || "-"}
                        </p>
                      </div>

                      <div className="text-right text-sm text-slate-600">
                        <p>Qty: {item.quantity}</p>
                        <p>Unit: {formatCurrency(item.unit_price)}</p>
                        <p className="font-medium text-slate-900">
                          Total: {formatCurrency(item.total_price)}
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
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Subtotal"
                value={formatCurrency(quotation.subtotal)}
              />
              <SummaryItem
                label="Discount"
                value={formatCurrency(quotation.discount)}
              />
              <SummaryItem label="Tax" value={formatCurrency(quotation.tax)} />
              <SummaryItem label="Total" value={formatCurrency(quotation.total)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {quotation.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuotationStatusForm
            quotationId={quotation.id}
            currentStatus={quotation.status}
          />

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Created"
                value={formatDateTime(quotation.created_at)}
              />
              <SummaryItem
                label="Updated"
                value={formatDateTime(quotation.updated_at)}
              />
              <SummaryItem label="Status" value={quotation.status} />
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
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900">{value ?? "-"}</p>
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