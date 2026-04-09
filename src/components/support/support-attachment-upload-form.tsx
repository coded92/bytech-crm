"use client";

import { useState, useTransition } from "react";
import { uploadAttachmentAction } from "@/lib/actions/attachments";
import { Button } from "@/components/ui/button";

export function SupportAttachmentUploadForm({
  ticketId,
}: {
  ticketId: string;
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
          const fileEntry = formData.get("attachment");

          if (!(fileEntry instanceof File)) {
            setError("Please choose a file");
            return;
          }

          const result = await uploadAttachmentAction({
            relatedTable: "support_tickets",
            relatedId: ticketId,
            bucket: "attachments",
            folder: `support/${ticketId}`,
            file: fileEntry,
            revalidatePaths: [`/support/${ticketId}`],
          });

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Attachment uploaded successfully.");
        });
      }}
      className="space-y-4"
    >
      <input
        type="file"
        name="attachment"
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
        {isPending ? "Uploading..." : "Upload Attachment"}
      </Button>
    </form>
  );
}