"use client";

import { useState, useTransition } from "react";
import { deleteCompanyLogoAction } from "@/lib/actions/company-logo";
import { Button } from "@/components/ui/button";

export function CompanyLogoActions({
  logoUrl,
}: {
  logoUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDownload() {
    const link = document.createElement("a");
    link.href = logoUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = "company-logo";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline">
          <a href={logoUrl} target="_blank" rel="noopener noreferrer">
            View Logo
          </a>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
        >
          Download Logo
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setError("");

            const confirmed = window.confirm(
              "Are you sure you want to delete the current logo?"
            );

            if (!confirmed) return;

            startTransition(async () => {
              const result = await deleteCompanyLogoAction();

              if (result?.error) {
                setError(result.error);
                return;
              }

              window.location.reload();
            });
          }}
        >
          {isPending ? "Deleting..." : "Delete Logo"}
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}