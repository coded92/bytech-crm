import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/projects/project-form";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: project },
    { data: customers },
    { data: leads },
    { data: quotations },
    { data: invoices },
    { data: staffUsers },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("customers").select("id, company_name").order("company_name"),
    supabase.from("leads").select("id, company_name").order("company_name"),
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
      .order("full_name"),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Project
        </h2>
        <p className="text-slate-600">
          Update project details, finance, ownership, and schedule.
        </p>
      </div>

      <ProjectForm
        project={project}
        customers={customers || []}
        leads={leads || []}
        quotations={quotations || []}
        invoices={invoices || []}
        staffUsers={staffUsers || []}
      />
    </div>
  );
}