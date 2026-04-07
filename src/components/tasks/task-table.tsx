import Link from "next/link";
import { formatDateTime } from "@/lib/utils/format-date";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Badge } from "@/components/ui/badge";

type TaskRow = {
  id: string;
  title: string;
  task_type: "follow_up" | "support" | "payment" | "general" | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  assigned_to_profile?: {
    full_name: string | null;
  } | null;
};

export function TaskTable({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No tasks found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned To
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-4 text-sm font-medium text-slate-900">
                  {task.title}
                </td>
                <td className="px-4 py-4 text-sm capitalize text-slate-600">
                  {(task.task_type || "general").replaceAll("_", " ")}
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className="capitalize">
                    {task.priority}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {formatDateTime(task.due_date)}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {task.assigned_to_profile?.full_name ?? "-"}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-sm font-medium text-slate-900 underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}