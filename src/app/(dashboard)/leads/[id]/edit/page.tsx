import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadEditForm } from "@/components/leads/lead-edit-form";

type EditLeadPageProps = {
  params: Promise<{ id: string }>;
};

type LeadSource = {
  id: string;
  name: string;
};

type StaffUser = {
  id: string;
  full_name: string;
};

type LeadRow = {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string | null;
  email: string | null;
  business_type: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  source_id: string | null;
  assigned_to: string | null;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "follow_up"
    | "closed_won"
    | "closed_lost";
  estimated_value: number;
  interested_plan: "cloud" | "offline" | "unknown" | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
};

export default async function EditLeadPage({
  params,
}: EditLeadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead }, { data: sourcesData }, { data: staffData }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, company_name, contact_person, phone, email, business_type, industry, address, city, state, source_id, assigned_to, status, estimated_value, interested_plan, next_follow_up_at, lost_reason"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("lead_sources")
        .select("id, name")
        .order("name", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Lead
        </h2>
        <p className="text-slate-600">
          Update lead details, assignment, and follow-up plan.
        </p>
      </div>

      <LeadEditForm
        lead={lead as LeadRow}
        sources={(sourcesData ?? []) as LeadSource[]}
        staffUsers={(staffData ?? []) as StaffUser[]}
      />
    </div>
  );
}