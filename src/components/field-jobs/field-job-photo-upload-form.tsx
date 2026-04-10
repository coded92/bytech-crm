"use client";

import { useState, useTransition } from "react";
import { uploadFieldJobPhotoAction } from "@/lib/actions/field-job-photos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FieldJobPhotoUploadForm({
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
          const result = await uploadFieldJobPhotoAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Photo uploaded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="field_job_id" value={fieldJobId} />

        <div className="space-y-2">
          <Label htmlFor="photo_type">Photo Type</Label>
          <select
            id="photo_type"
            name="photo_type"
            defaultValue="before"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="before">Before</option>
            <option value="after">After</option>
            <option value="inspection">Inspection</option>
            <option value="materials">Materials</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">Photo</Label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea id="caption" name="caption" rows={3} />
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
          {isPending ? "Uploading..." : "Upload Photo"}
        </Button>
      </fieldset>
    </form>
  );
}