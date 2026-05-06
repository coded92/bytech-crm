"use client";

import { useState, useTransition } from "react";
import { applyProjectTemplateAction } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ProjectTemplate = {
  id: string;
  name: string;
};

export function ProjectTemplateForm({
  projectId,
  templates,
}: {
  projectId: string;
  templates: ProjectTemplate[];
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
          const result = await applyProjectTemplateAction(projectId, formData);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setSuccess("Template tasks added successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template_id">Project Template</Label>
          <select
            id="template_id"
            name="template_id"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-600">{success}</p> : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying..." : "Apply Template"}
        </Button>
      </fieldset>
    </form>
  );
}