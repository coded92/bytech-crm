import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format-date";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskStatusForm } from "@/components/tasks/task-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    full_name: string | null;
  } | null;
  assigned_by_profile?: {
    full_name: string | null;
  } | null;
  lead?: {
    id: string;
    company_name: string | null;
  } | null;
  customer?: {
    id: string;
    company_name: string | null;
  } | null;
};

export default async function TaskDetailsPage({
  params,
}: TaskDetailsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: taskData } = await supabase
    .from("tasks")
    .select(`
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
      assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name),
      lead:leads(id, company_name),
      customer:customers(id, company_name)
    `)
    .eq("id", id)
    .single();

  const task = taskData as TaskRow | null;

  if (!task) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {task.title}
          </h2>
          <p className="text-slate-600">
            {task.description || "No description"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">
            {task.priority}
          </Badge>
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Title" value={task.title} />
              <InfoItem
                label="Task Type"
                value={(task.task_type || "general").replaceAll("_", " ")}
              />
              <InfoItem
                label="Assigned To"
                value={task.assigned_to_profile?.full_name ?? "-"}
              />
              <InfoItem
                label="Assigned By"
                value={task.assigned_by_profile?.full_name ?? "-"}
              />
              <InfoItem
                label="Due Date"
                value={formatDateTime(task.due_date)}
              />
              <InfoItem
                label="Completed At"
                value={formatDateTime(task.completed_at)}
              />
              <InfoItem
                label="Created At"
                value={formatDateTime(task.created_at)}
              />
              <InfoItem
                label="Updated At"
                value={formatDateTime(task.updated_at)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Records</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {task.lead?.id ? (
                  <Button asChild variant="outline">
                    <Link href={`/leads/${task.lead.id}`}>
                      Lead: {task.lead.company_name}
                    </Link>
                  </Button>
                ) : null}

                {task.customer?.id ? (
                  <Button asChild variant="outline">
                    <Link href={`/customers/${task.customer.id}`}>
                      Customer: {task.customer.company_name}
                    </Link>
                  </Button>
                ) : null}

                {!task.lead?.id && !task.customer?.id ? (
                  <p className="text-sm text-slate-500">
                    No linked records.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {task.description || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TaskStatusForm taskId={task.id} currentStatus={task.status} />

          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <SummaryItem label="Status" value={task.status} />
              <SummaryItem label="Priority" value={task.priority} />
              <SummaryItem
                label="Due"
                value={formatDateTime(task.due_date)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">
        {value ?? "-"}
      </p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">
        {value}
      </span>
    </div>
  );
}