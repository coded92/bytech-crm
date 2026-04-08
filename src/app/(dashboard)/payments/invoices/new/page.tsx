import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { InvoiceForm } from "@/components/payments/invoice-form";

type NewInvoicePageProps = {
  searchParams: Promise<{
    customerId?: string;
    quotationId?: string;
  }>;
};

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  await requireAdmin();

  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: quotations }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name")
      .order("company_name"),
    supabase
      .from("quotations")
      .select("id, quote_number, customer_id, total, status")
      .in("status", ["accepted", "sent", "draft"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Invoice
        </h2>
        <p className="text-slate-600">
          Create an invoice from a customer or quotation.
        </p>
      </div>

      <InvoiceForm
        customers={customers || []}
        quotations={quotations || []}
        prefilledCustomerId={resolvedSearchParams.customerId || ""}
        prefilledQuotationId={resolvedSearchParams.quotationId || ""}
      />
    </div>
  );
}