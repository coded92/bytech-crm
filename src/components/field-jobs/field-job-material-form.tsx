"use client";

import { useState, useTransition } from "react";
import { createFieldJobMaterialAction } from "@/lib/actions/field-job-materials";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FieldJobMaterialForm({
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
          const result = await createFieldJobMaterialAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Material added successfully.");
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="field_job_id" value={fieldJobId} />

      <div className="space-y-2">
        <Label htmlFor="item_name">Item / Material Name</Label>
        <input
          id="item_name"
          name="item_name"
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="POS cable"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue="1"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <input
            id="unit"
            name="unit"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="pcs / meter"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <input
            id="unit_cost"
            name="unit_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
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
        {isPending ? "Saving..." : "Add Material"}
      </Button>
    </form>
  );
}