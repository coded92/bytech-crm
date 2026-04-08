"use client";

import { useState, useTransition } from "react";
import { runReminderScanAction } from "@/lib/actions/automation";
import { Button } from "@/components/ui/button";

export function RunReminderScanButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setMessage("");
          setError("");

          startTransition(async () => {
            const result = await runReminderScanAction();

            if (result?.error) {
              setError(result.error);
              return;
            }

            setMessage(
              `Reminder scan completed. ${result?.createdCount ?? 0} reminder(s) created.`
            );
          });
        }}
      >
        {isPending ? "Running..." : "Run Reminder Scan"}
      </Button>

      {message ? (
        <span className="text-sm text-green-600">{message}</span>
      ) : null}

      {error ? (
        <span className="text-sm text-red-600">{error}</span>
      ) : null}
    </div>
  );
}