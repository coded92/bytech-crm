import { createClient } from "@/lib/supabase/server";
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
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: quotations }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name")
      .order("company_name"),
    supabase
      .from("quotations")
      .select("id, quote_number, company_name")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Invoice
        </h2>
        <p className="text-slate-600">
          Generate a new invoice for a customer.
        </p>
      </div>

      <InvoiceForm
        customers={(customers || []) as any}
        quotations={(quotations || []) as any}
        prefilledCustomerId={params.customerId || ""}
        prefilledQuotationId={params.quotationId || ""}
      />
    </div>
  );
}