"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type ConfirmActionButtonProps = {
  label: string;
  confirmMessage: string;
  action: () => Promise<{ error?: string; success?: boolean } | void>;
  variant?: "default" | "outline" | "destructive";
};

export function ConfirmActionButton({
  label,
  confirmMessage,
  action,
  variant = "outline",
}: ConfirmActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        disabled={isPending}
        onClick={() => {
          setError("");

          const confirmed = window.confirm(confirmMessage);
          if (!confirmed) return;

          startTransition(async () => {
            const result = await action();

            if (result && "error" in result && result.error) {
              setError(result.error);
              return;
            }

            window.location.reload();
          });
        }}
      >
        {isPending ? "Please wait..." : label}
      </Button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}