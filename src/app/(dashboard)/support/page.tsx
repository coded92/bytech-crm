import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SupportTable } from "@/components/support/support-table";
import { Button } from "@/components/ui/button";

export default async function SupportPage() {
  const supabase = await createClient();

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select(`
      id,
      ticket_number,
      title,
      issue_type,
      priority,
      status,
      created_at,
      customer:customers(company_name),
      assigned_profile:profiles!support_tickets_assigned_to_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Support Tickets
          </h2>
          <p className="text-slate-600">
            Track repairs, issues, and customer support work.
          </p>
        </div>

        <Button asChild>
          <Link href="/support/new">Create Ticket</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load support tickets: {error.message}
        </div>
      ) : (
        <SupportTable tickets={tickets || []} />
      )}
    </div>
  );
}