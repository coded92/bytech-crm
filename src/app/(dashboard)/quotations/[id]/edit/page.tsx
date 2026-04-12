import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuotationEditForm } from "@/components/quotations/quotation-edit-form";

type EditQuotationPageProps = {
  params: Promise<{ id: string }>;
};

type LeadOption = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type CustomerOption = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type QuotationItemRow = {
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
};

type QuotationRow = {
  id: string;
  lead_id: string | null;
  customer_id: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  valid_until: string | null;
  discount: number;
  tax: number;
  notes: string | null;
  items: QuotationItemRow[];
};

export default async function EditQuotationPage({
  params,
}: EditQuotationPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quotationData }, { data: leadsData }, { data: customersData }, { data: itemsData }] =
    await Promise.all([
      supabase
        .from("quotations")
        .select(
          "id, lead_id, customer_id, company_name, contact_person, email, phone, address, valid_until, discount, tax, notes"
        )
        .eq("id", id)
        .single(),

      supabase
        .from("leads")
        .select("id, company_name, contact_person, email, phone, address")
        .order("company_name", { ascending: true }),

      supabase
        .from("customers")
        .select("id, company_name, contact_person, email, phone, address")
        .order("company_name", { ascending: true }),

      supabase
        .from("quotation_items")
        .select("item_name, description, quantity, unit_price")
        .eq("quotation_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (!quotationData) {
    notFound();
  }

  const quotation = {
    ...(quotationData as Omit<QuotationRow, "items">),
    items: (itemsData ?? []) as QuotationItemRow[],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Quotation
        </h2>
        <p className="text-slate-600">
          Update quotation details, line items, and totals.
        </p>
      </div>

      <QuotationEditForm
        quotation={quotation}
        leads={(leadsData ?? []) as LeadOption[]}
        customers={(customersData ?? []) as CustomerOption[]}
      />
    </div>
  );
}