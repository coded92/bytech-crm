"use client";

import { useState, useTransition } from "react";
import { createProjectTaskAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StaffOption = {
  id: string;
  full_name: string;
};

export function ProjectTaskForm({
  projectId,
  staffUsers,
}: {
  projectId: string;
  staffUsers: StaffOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
          const result = await createProjectTaskAction(formData);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setSuccess("Task added successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="project_id" value={projectId} />

        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To</Label>
            <select
              id="assigned_to"
              name="assigned_to"
              defaultValue=""
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {staffUsers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.full_name}
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
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
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
              defaultValue="todo"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" name="due_date" type="datetime-local" />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
            {success}
          </div>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add Task"}
        </Button>
      </fieldset>
    </form>
  );
}