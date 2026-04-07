import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "@/components/leads/lead-form";

export default async function NewLeadPage() {
  const supabase = await createClient();

  const [{ data: sources }, { data: staffUsers }] = await Promise.all([
    supabase.from("lead_sources").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add Lead</h2>
        <p className="text-slate-600">Create a new sales lead and assign follow-up.</p>
      </div>

      <LeadForm sources={sources || []} staffUsers={staffUsers || []} />
    </div>
  );
}