"use client";

import { useState, useTransition } from "react";
import { uploadAttachmentAction } from "@/lib/actions/attachments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ProjectDocumentForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");
        setSuccess("");

        const file = formData.get("file");

        startTransition(async () => {
          if (!(file instanceof File)) {
            setError("Please select a file.");
            return;
          }

          const result = await uploadAttachmentAction({
            relatedTable: "projects",
            relatedId: projectId,
            bucket: "attachments",
            folder: `projects/${projectId}`,
            file,
            revalidatePaths: [`/projects/${projectId}`],
          });

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setSuccess("Document uploaded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">Upload Project Document</Label>
          <input
            id="file"
            name="file"
            type="file"
            className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-600">{success}</p> : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Uploading..." : "Upload Document"}
        </Button>
      </fieldset>
    </form>
  );
}