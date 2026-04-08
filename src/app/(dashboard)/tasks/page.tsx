import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { TaskTable } from "@/components/tasks/task-table";
import { Button } from "@/components/ui/button";

export default async function TasksPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const query =
    profile.role === "admin"
      ? supabase
          .from("tasks")
          .select(`
            id,
            title,
            task_type,
            priority,
            status,
            due_date,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
          `)
          .order("created_at", { ascending: false })
      : supabase
          .from("tasks")
          .select(`
            id,
            title,
            task_type,
            priority,
            status,
            due_date,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
          `)
          .eq("assigned_to", profile.id)
          .order("created_at", { ascending: false });

  const { data: tasks, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Tasks
          </h2>
          <p className="text-slate-600">
            Manage assigned work and daily execution.
          </p>
        </div>

        {profile.role === "admin" ? (
          <Button asChild>
            <Link href="/tasks/new">Create Task</Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load tasks: {error.message}
        </div>
      ) : (
        <TaskTable tasks={tasks || []} />
      )}
    </div>
  );
}