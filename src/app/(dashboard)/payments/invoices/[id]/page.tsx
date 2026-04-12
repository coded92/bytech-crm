import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { PaymentForm } from "@/components/payments/payment-form";
import { InvoiceStatusBadge } from "@/components/payments/invoice-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InvoiceDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  customer_id: string;
  quotation_id?: string | null;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  paid_date: string | null;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  billing_period_start: string | null;
  billing_period_end: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    company_name: string | null;
  } | null;
  quotation?: {
    id: string;
    quote_number: string | null;
  } | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  paid_at: string;
  payment_reference: string | null;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  payment_transaction_id: string | null;
  payment_date: string;
};

export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoiceData }, { data: paymentsData }, { data: receiptsData }] =
    await Promise.all([
      supabase
        .from("payment_invoices")
        .select(`
          *,
          customer:customers(id, company_name),
          quotation:quotations(id, quote_number)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("payment_transactions")
        .select("*")
        .eq("invoice_id", id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("receipts")
        .select("id, receipt_number, payment_transaction_id, payment_date")
        .eq("invoice_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const invoice = invoiceData as InvoiceRow | null;
  const payments = (paymentsData ?? []) as PaymentRow[];
  const receipts = (receiptsData ?? []) as ReceiptRow[];

  if (!invoice) {
    notFound();
  }

  const canRecordPayment =
    invoice.status !== "paid" &&
    invoice.status !== "waived" &&
    invoice.balance > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {invoice.invoice_number}
          </h2>
          <p className="text-slate-600">
            {invoice.customer?.company_name ?? "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <InvoiceStatusBadge status={invoice.status} />

          <Button asChild variant="outline">
            <Link href={`/payments/invoices/${invoice.id}/edit`}>
              Edit Invoice
            </Link>
          </Button>
          {invoice.customer?.id ? (
            <Button asChild variant="outline">
              <Link href={`/customers/${invoice.customer.id}`}>
                View Customer
              </Link>
            </Button>
          ) : null}

          {invoice.quotation?.id ? (
            <Button asChild variant="outline">
              <Link href={`/quotations/${invoice.quotation.id}`}>
                View Quotation
              </Link>
            </Button>
          ) : null}

          <Button asChild variant="outline">
            <Link href={`/payments/invoices/${invoice.id}/print`}>
              Print Version
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Invoice Number" value={invoice.invoice_number} />
              <InfoItem
                label="Invoice Type"
                value={invoice.invoice_type.replaceAll("_", " ")}
              />
              <InfoItem
                label="Customer"
                value={invoice.customer?.company_name ?? "-"}
              />
              <InfoItem
                label="Quotation"
                value={invoice.quotation?.quote_number ?? "-"}
              />
              <InfoItem label="Amount" value={formatCurrency(invoice.amount)} />
              <InfoItem
                label="Amount Paid"
                value={formatCurrency(invoice.amount_paid)}
              />
              <InfoItem label="Balance" value={formatCurrency(invoice.balance)} />
              <InfoItem label="Due Date" value={formatDate(invoice.due_date)} />
              <InfoItem
                label="Billing Start"
                value={formatDate(invoice.billing_period_start)}
              />
              <InfoItem
                label="Billing End"
                value={formatDate(invoice.billing_period_end)}
              />
              <InfoItem label="Paid Date" value={formatDate(invoice.paid_date)} />
              <InfoItem label="Reference" value={invoice.reference} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {payments.length === 0 ? (
                <div className="text-sm text-slate-500">No payments yet.</div>
              ) : (
                payments.map((payment) => {
                  const relatedReceipt = receipts.find(
                    (receipt) => receipt.payment_transaction_id === payment.id
                  );

                  return (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="mt-1 text-sm capitalize text-slate-500">
                            {payment.payment_method || "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(payment.paid_at)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Ref: {payment.payment_reference || "-"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {relatedReceipt ? (
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/payments/receipts/${relatedReceipt.id}`}>
                                View Receipt
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {invoice.notes || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {canRecordPayment ? (
            <PaymentForm
              invoiceId={invoice.id}
              customerId={invoice.customer_id}
              balance={invoice.balance}
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem
                label="Created"
                value={formatDateTime(invoice.created_at)}
              />
              <SummaryItem
                label="Updated"
                value={formatDateTime(invoice.updated_at)}
              />
              <SummaryItem label="Status" value={invoice.status} />
              <SummaryItem
                label="Balance"
                value={formatCurrency(invoice.balance)}
              />
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
      <p className="mt-1 text-sm capitalize text-slate-900">{value ?? "-"}</p>
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