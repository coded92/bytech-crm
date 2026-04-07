import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConvertLeadForm } from "@/components/customers/convert-lead-form";

type ConvertLeadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LeadRow = {
  id: string;
  company_name: string;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "follow_up"
    | "closed_won"
    | "closed_lost";
  converted_customer_id: string | null;
};

export default async function ConvertLeadPage({
  params,
}: ConvertLeadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: leadData } = await supabase
    .from("leads")
    .select("id, company_name, status, converted_customer_id")
    .eq("id", id)
    .single();

  const lead = leadData as LeadRow | null;

  if (!lead) {
    notFound();
  }

  if (lead.converted_customer_id) {
    redirect(`/customers/${lead.converted_customer_id}`);
  }

  if (lead.status === "closed_lost") {
    redirect(`/leads/${lead.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Convert Lead
        </h2>
        <p className="text-slate-600">
          Convert this lead into an active customer.
        </p>
      </div>

      <ConvertLeadForm leadId={lead.id} companyName={lead.company_name} />
    </div>
  );
}