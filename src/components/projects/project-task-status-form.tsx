"use client";

import { useState, useTransition } from "react";
import { updateProjectTaskStatusAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ProjectTaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "completed"
  | "blocked"
  | "cancelled";

export function ProjectTaskStatusForm({
  taskId,
  projectId,
  currentStatus,
}: {
  taskId: string;
  projectId: string;
  currentStatus: ProjectTaskStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");

        startTransition(async () => {
          const result = await updateProjectTaskStatusAction(
            taskId,
            projectId,
            formData
          );

          if ("error" in result) {
            setError(result.error);
          }
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <Label htmlFor={`status-${taskId}`}>Status</Label>
        <select
          id={`status-${taskId}`}
          name="status"
          defaultValue={currentStatus}
          className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Saving..." : "Update"}
      </Button>

      {error ? (
        <p className="w-full text-sm text-red-600">{error}</p>
      ) : null}
    </form>
  );
}