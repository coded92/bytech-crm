"use client";

import { useState, useTransition } from "react";
import { createFieldJobUpdateAction } from "@/lib/actions/field-jobs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FieldJobUpdateForm({
  fieldJobId,
}: {
  fieldJobId: string;
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
          const result = await createFieldJobUpdateAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Job update added successfully.");
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="field_job_id" value={fieldJobId} />

      <div className="space-y-2">
        <Label htmlFor="note">Update Note</Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          placeholder="Engineer arrived on site and started cable tracing..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Update Status</Label>
        <select
          id="status"
          name="status"
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Keep current status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_parts">Awaiting Parts</option>
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
        {isPending ? "Saving..." : "Add Update"}
      </Button>
    </form>
  );
}