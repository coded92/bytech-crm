"use client";

import { useState, useTransition } from "react";
import { uploadCompanyLogoAction } from "@/lib/actions/company-logo";
import { Button } from "@/components/ui/button";

export function CompanyLogoUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
          const result = await uploadCompanyLogoAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Logo uploaded successfully.");
        });
      }}
      className="space-y-4"
    >
      <input
        type="file"
        name="logo"
        accept="image/*"
        className="block w-full text-sm text-slate-700"
      />

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
        {isPending ? "Uploading..." : "Upload Logo"}
      </Button>
    </form>
  );
}