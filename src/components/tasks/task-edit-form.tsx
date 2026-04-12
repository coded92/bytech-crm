"use client";

import { useState, useTransition } from "react";
import { updateTaskAction } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

type TaskData = {
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

type TaskEditFormProps = {
  task: TaskData;
  staffUsers: StaffUser[];
  leads: LeadOption[];
  customers: CustomerOption[];
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TaskEditForm({
  task,
  staffUsers,
  leads,
  customers,
}: TaskEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Task</CardTitle>
        <CardDescription>
          Update task assignment and linked work context.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateTaskAction(task.id, formData);

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={task.title}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={task.description ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task_type">Task Type</Label>
                <select
                  id="task_type"
                  name="task_type"
                  defaultValue={task.task_type ?? "general"}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="general">General</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="support">Support</option>
                  <option value="payment">Payment</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To</Label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue={task.assigned_to}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select staff</option>
                  {staffUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue={task.priority}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={task.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(task.due_date)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="related_lead_id">Related Lead</Label>
                <select
                  id="related_lead_id"
                  name="related_lead_id"
                  defaultValue={task.related_lead_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="">No related lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="related_customer_id">Related Customer</Label>
                <select
                  id="related_customer_id"
                  name="related_customer_id"
                  defaultValue={task.related_customer_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="">No related customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}