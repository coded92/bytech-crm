import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskEditForm } from "@/components/tasks/task-edit-form";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

type StaffUser = {
  id: string;
  full_name: string;
};

type LeadOption = {
  id: string;
  company_name: string;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: "follow_up" | "support" | "payment" | "general" | null;
  related_lead_id: string | null;
  related_customer_id: string | null;
  assigned_to: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
};

export default async function EditTaskPage({
  params,
}: EditTaskPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: task }, { data: staffData }, { data: leadsData }, { data: customersData }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, title, description, task_type, related_lead_id, related_customer_id, assigned_to, priority, status, due_date"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
      supabase
        .from("leads")
        .select("id, company_name")
        .order("company_name", { ascending: true }),
      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name", { ascending: true }),
    ]);

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Task
        </h2>
        <p className="text-slate-600">
          Update task details, assignment, and due date.
        </p>
      </div>

      <TaskEditForm
        task={task as TaskRow}
        staffUsers={(staffData ?? []) as StaffUser[]}
        leads={(leadsData ?? []) as LeadOption[]}
        customers={(customersData ?? []) as CustomerOption[]}
      />
    </div>
  );
}