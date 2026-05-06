import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const [
    { data: customers },
    { data: leads },
    { data: quotations },
    { data: invoices },
    { data: staffUsers },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name")
      .order("company_name", { ascending: true }),
    supabase
      .from("leads")
      .select("id, company_name")
      .order("company_name", { ascending: true }),
    supabase
      .from("quotations")
      .select("id, quote_number, company_name, total")
      .order("created_at", { ascending: false }),
    supabase
      .from("payment_invoices")
      .select("id, invoice_number, amount, amount_paid, balance")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Project
        </h2>
        <p className="text-slate-600">
          Start a new paid client project or operational delivery workflow.
        </p>
      </div>

      <ProjectForm
        customers={customers || []}
        leads={leads || []}
        quotations={quotations || []}
        invoices={invoices || []}
        staffUsers={staffUsers || []}
      />
    </div>
  );
}