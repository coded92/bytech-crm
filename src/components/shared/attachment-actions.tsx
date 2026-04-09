"use client";

import { useState, useTransition } from "react";
import {
  deleteAttachmentAction,
  getAttachmentSignedUrlAction,
} from "@/lib/actions/attachment-files";
import { Button } from "@/components/ui/button";

export function AttachmentActions({
  attachmentId,
  canDelete = false,
  revalidatePaths = [],
}: {
  attachmentId: string;
  canDelete?: boolean;
  revalidatePaths?: string[];
}) {
  const [isViewPending, startViewTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [error, setError] = useState("");

  function openSignedUrl(download = false) {
    setError("");

    startViewTransition(async () => {
      const result = await getAttachmentSignedUrlAction(attachmentId);

      if (result?.error || !result?.url) {
        setError(result?.error ?? "Failed to open file");
        return;
      }

      if (download) {
        const link = document.createElement("a");
        link.href = result.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isViewPending}
          onClick={() => openSignedUrl(false)}
        >
          {isViewPending ? "Opening..." : "View"}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isViewPending}
          onClick={() => openSignedUrl(true)}
        >
          Download
        </Button>

        {canDelete ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeletePending}
            onClick={() => {
              setError("");

              const confirmed = window.confirm(
                "Are you sure you want to delete this attachment?"
              );

              if (!confirmed) return;

              startDeleteTransition(async () => {
                const result = await deleteAttachmentAction({
                  attachmentId,
                  revalidatePaths,
                });

                if (result?.error) {
                  setError(result.error);
                  return;
                }

                window.location.reload();
              });
            }}
          >
            {isDeletePending ? "Deleting..." : "Delete"}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}