"use client";

import { createTaskAction } from "@/lib/actions/tasks";
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

type TaskFormProps = {
  staffUsers: StaffUser[];
  leads: LeadOption[];
  customers: CustomerOption[];
};

export function TaskForm({
  staffUsers,
  leads,
  customers,
}: TaskFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Task</CardTitle>
        <CardDescription>
          Assign a task to a staff member and link it to work context.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={createTaskAction as any} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task_type">Task Type</Label>
              <select
                id="task_type"
                name="task_type"
                defaultValue="general"
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
                defaultValue=""
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
                defaultValue="medium"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <select
                id="status"
                name="status"
                defaultValue="pending"
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
              <Input id="due_date" name="due_date" type="datetime-local" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="related_lead_id">Related Lead</Label>
              <select
                id="related_lead_id"
                name="related_lead_id"
                defaultValue=""
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
                defaultValue=""
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

          <Button type="submit">Create Task</Button>
        </form>
      </CardContent>
    </Card>
  );
}