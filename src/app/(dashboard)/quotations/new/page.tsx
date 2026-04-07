import { createClient } from "@/lib/supabase/server";
import { QuotationForm } from "@/components/quotations/quotation-form";

type Props = {
  searchParams: Promise<{
    leadId?: string;
    customerId?: string;
  }>;
};

export default async function NewQuotationPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: leads }, { data: customers }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, company_name, contact_person, email, phone, address")
      .order("company_name"),
    supabase
      .from("customers")
      .select("id, company_name, contact_person, email, phone, address")
      .order("company_name"),
  ]);

  const prefilledLeadId = params.leadId || "";
  const prefilledCustomerId = params.customerId || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Quotation
        </h2>
        <p className="text-slate-600">
          Build a quotation with line items and totals.
        </p>
      </div>

      <QuotationForm
        leads={(leads || []) as any}
        customers={(customers || []) as any}
        prefilledLeadId={prefilledLeadId}
        prefilledCustomerId={prefilledCustomerId}
      />
    </div>
  );
}