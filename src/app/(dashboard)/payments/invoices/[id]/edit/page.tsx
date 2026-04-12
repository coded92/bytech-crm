import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceEditForm } from "@/components/payments/invoice-edit-form";

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type QuotationOption = {
  id: string;
  quote_number: string;
  company_name?: string | null;
};

type InvoiceRow = {
  id: string;
  customer_id: string;
  quotation_id: string | null;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  due_date: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  billing_period_start: string | null;
  billing_period_end: string | null;
  reference: string | null;
  notes: string | null;
};

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: customersData }, { data: quotationsData }] =
    await Promise.all([
      supabase
        .from("payment_invoices")
        .select(
          "id, customer_id, quotation_id, invoice_type, amount, amount_paid, due_date, status, billing_period_start, billing_period_end, reference, notes"
        )
        .eq("id", id)
        .single(),

      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name", { ascending: true }),

      supabase
        .from("quotations")
        .select("id, quote_number, company_name")
        .order("created_at", { ascending: false }),
    ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Invoice
        </h2>
        <p className="text-slate-600">
          Update invoice details, due date, and billing information.
        </p>
      </div>

      <InvoiceEditForm
        invoice={invoice as InvoiceRow}
        customers={(customersData ?? []) as CustomerOption[]}
        quotations={(quotationsData ?? []) as QuotationOption[]}
      />
    </div>
  );
}