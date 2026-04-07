import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadTable } from "@/components/leads/lead-table";
import { Button } from "@/components/ui/button";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(`
      id,
      company_name,
      contact_person,
      phone,
      status,
      estimated_value,
      next_follow_up_at,
      assigned_profile:profiles!leads_assigned_to_fkey (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h2>
          <p className="text-slate-600">Manage your sales pipeline and follow-ups.</p>
        </div>

        <Button asChild>
          <Link href="/leads/new">Add Lead</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load leads: {error.message}
        </div>
      ) : (
        <LeadTable leads={leads || []} />
      )}
    </div>
  );
}