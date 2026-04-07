import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage() {
  const supabase = await createClient();

  const [{ data: staffUsers }, { data: leads }, { data: customers }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("leads")
        .select("id, company_name")
        .order("company_name"),
      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name"),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Task
        </h2>
        <p className="text-slate-600">
          Assign work to staff and link it to leads or customers.
        </p>
      </div>

      <TaskForm
        staffUsers={staffUsers || []}
        leads={leads || []}
        customers={customers || []}
      />
    </div>
  );
}