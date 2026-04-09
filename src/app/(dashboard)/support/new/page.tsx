import { createClient } from "@/lib/supabase/server";
import { SupportForm } from "@/components/support/support-form";

export default async function NewSupportTicketPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: staff }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name")
      .order("company_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Support Ticket
        </h2>
        <p className="text-slate-600">
          Log a repair, support issue, or customer complaint.
        </p>
      </div>

      <SupportForm customers={customers || []} staff={staff || []} />
    </div>
  );
}