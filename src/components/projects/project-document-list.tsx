"use client";

import { useState, useTransition } from "react";
import {
  deleteAttachmentAction,
  getAttachmentSignedUrlAction,
} from "@/lib/actions/attachment-files";
import { Button } from "@/components/ui/button";

type ProjectDocument = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export function ProjectDocumentList({
  projectId,
  documents,
}: {
  projectId: string;
  documents: ProjectDocument[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function openDocument(attachmentId: string) {
    setError("");

    startTransition(async () => {
      const result = await getAttachmentSignedUrlAction(attachmentId);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      window.open(result.url, "_blank");
    });
  }

  function deleteDocument(attachmentId: string) {
    setError("");

    startTransition(async () => {
      const result = await deleteAttachmentAction({
        attachmentId,
        revalidatePaths: [`/projects/${projectId}`],
      });

      if ("error" in result) {
        setError(result.error);
      }
    });
  }

  if (documents.length === 0) {
    return <p className="text-sm text-slate-500">No documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">
              {doc.file_name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {doc.mime_type || "File"} ·{" "}
              {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "-"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => openDocument(doc.id)}
            >
              Open
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => deleteDocument(doc.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}