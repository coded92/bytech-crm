"use client";

import { useRef, useState, useTransition } from "react";
import { createProjectTimelineAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProjectTimelineForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
          const result = await createProjectTimelineAction(formData);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          formRef.current?.reset();
          setSuccess("Collaboration update added successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="project_id" value={projectId} />

        <div className="space-y-2">
          <Label htmlFor="timeline_type">Update Type</Label>
          <select
            id="timeline_type"
            name="timeline_type"
            defaultValue="comment"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="comment">Comment</option>
            <option value="client_update">Client Update</option>
            <option value="internal_note">Internal Note</option>
            <option value="call">Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="meeting">Meeting</option>
            <option value="approval">Approval</option>
            <option value="progress_update">Progress Update</option>
            <option value="blocker">Blocker</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeline_title">Title</Label>
          <Input
            id="timeline_title"
            name="title"
            placeholder="e.g. Client approved homepage design"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Details</Label>
          <Textarea
            id="note"
            name="note"
            rows={4}
            placeholder="Write the update, decision, approval, blocker, or next step..."
          />
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
          {isPending ? "Saving..." : "Add Update"}
        </Button>
      </fieldset>
    </form>
  );
}