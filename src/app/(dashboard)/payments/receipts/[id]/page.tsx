import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProofOfPaymentUploadForm } from "@/components/payments/proof-of-payment-upload-form";
import { AttachmentList } from "@/components/shared/attachment-list";

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

type ReceiptRow = {
  id: string;
  receipt_number: string;
  amount_received: number;
  payment_method: string | null;
  payment_date: string;
  notes: string | null;
  customer?: {
    id: string;
    company_name: string | null;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice?: {
    id: string;
    invoice_number: string | null;
  } | null;
};

type AttachmentRow = {
  id: string;
  file_name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  if (!id || id === "undefined") {
    notFound();
  }

  const [{ data: receiptData }, { data: attachmentsData }] = await Promise.all([
    supabase
      .from("receipts")
      .select(`
        *,
        customer:customers(id, company_name, contact_person, email, phone),
        invoice:payment_invoices(id, invoice_number)
      `)
      .eq("id", id)
      .maybeSingle(),

    (supabase as any)
      .from("file_attachments")
      .select(
        "id, file_name, file_path, bucket_name, mime_type, file_size, created_at"
      )
      .eq("related_table", "receipts")
      .eq("related_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const receipt = receiptData as ReceiptRow | null;

  if (!receipt) {
    notFound();
  }

  const attachments = (attachmentsData ?? []) as AttachmentRow[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Receipt {receipt.receipt_number}
          </h2>
          <p className="text-slate-600">Payment confirmation</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {receipt.invoice?.id ? (
            <Button asChild variant="outline">
              <Link href={`/payments/invoices/${receipt.invoice.id}`}>
                View Invoice
              </Link>
            </Button>
          ) : null}

          <Button asChild variant="outline">
            <Link href={`/payments/receipts/${receipt.id}/print`}>
              Print Version
            </Link>
          </Button>
        </div>
      </div>

      <Card className="print:border-slate-300 print:shadow-none">
        <CardHeader>
          <CardTitle>Receipt Details</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Receipt Number" value={receipt.receipt_number} />
          <InfoItem
            label="Invoice Number"
            value={receipt.invoice?.invoice_number ?? "-"}
          />
          <InfoItem
            label="Customer"
            value={receipt.customer?.company_name ?? "-"}
          />
          <InfoItem
            label="Contact Person"
            value={receipt.customer?.contact_person ?? "-"}
          />
          <InfoItem label="Email" value={receipt.customer?.email ?? "-"} />
          <InfoItem label="Phone" value={receipt.customer?.phone ?? "-"} />
          <InfoItem
            label="Amount Received"
            value={formatCurrency(receipt.amount_received)}
          />
          <InfoItem
            label="Payment Method"
            value={receipt.payment_method ?? "-"}
          />
          <InfoItem
            label="Payment Date"
            value={formatDateTime(receipt.payment_date)}
          />
          <InfoItem label="Notes" value={receipt.notes ?? "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proof of Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProofOfPaymentUploadForm receiptId={receipt.id} />
          <AttachmentList
            attachments={attachments}
            canDelete={true}
            revalidatePaths={[`/payments/receipts/${receipt.id}`]}
          />
        </CardContent>
      </Card>
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