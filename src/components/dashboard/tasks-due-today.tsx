import Link from "next/link";
import { formatDateTime } from "@/lib/utils/format-date";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types";

type TaskItem = {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  assigned_to_profile?: {
    full_name: string | null;
  } | null;
};

export function TasksDueToday({ tasks }: { tasks: TaskItem[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        No tasks due today.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{task.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                Assigned to: {task.assigned_to_profile?.full_name || "-"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Due: {formatDateTime(task.due_date)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {task.priority}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {task.status.replaceAll("_", " ")}
              </Badge>
              <Link
                href="/tasks"
                className="text-xs font-medium text-slate-900 underline underline-offset-4"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}