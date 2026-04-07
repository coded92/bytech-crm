"use client";

import { useState, useTransition } from "react";
import { updateTaskStatusAction } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export function TaskStatusForm({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: TaskStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Task Status</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await updateTaskStatusAction(taskId, formData);

              const errorMessage = "error" in result ? result.error : null;

              if (errorMessage) {
                setError(errorMessage);
                return;
              }

              setSuccess("Task updated successfully.");
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={currentStatus}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
            {isPending ? "Updating..." : "Update Status"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}