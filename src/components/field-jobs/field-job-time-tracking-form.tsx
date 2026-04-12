"use client";

import { useState, useTransition } from "react";
import { updateFieldJobTimeAction } from "@/lib/actions/field-jobs";
import { Button } from "@/components/ui/button";

type FieldJobTimeTrackingFormProps = {
  fieldJobId: string;
  checkedInAt?: string | null;
  workStartedAt?: string | null;
  workCompletedAt?: string | null;
  checkedOutAt?: string | null;
};

export function FieldJobTimeTrackingForm({
  fieldJobId,
  checkedInAt,
  workStartedAt,
  workCompletedAt,
  checkedOutAt,
}: FieldJobTimeTrackingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function submitAction(actionType: string) {
    const formData = new FormData();
    formData.append("action_type", actionType);

    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await updateFieldJobTimeAction(fieldJobId, formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess("Time record updated successfully.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !!checkedInAt}
          onClick={() => submitAction("check_in")}
        >
          {checkedInAt ? "Checked In" : "Check In"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending || !!workStartedAt}
          onClick={() => submitAction("start_work")}
        >
          {workStartedAt ? "Work Started" : "Start Work"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending || !!workCompletedAt}
          onClick={() => submitAction("complete_work")}
        >
          {workCompletedAt ? "Work Completed" : "Complete Work"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending || !!checkedOutAt}
          onClick={() => submitAction("check_out")}
        >
          {checkedOutAt ? "Checked Out" : "Check Out"}
        </Button>
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
    </div>
  );
}