"use client";

import { useState, useTransition } from "react";
import { createInventoryMovementAction } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldJobOption = {
  id: string;
  job_number: string;
};

export function StockMovementForm({
  inventoryItemId,
  fieldJobs,
}: {
  inventoryItemId: string;
  fieldJobs: FieldJobOption[];
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
          const result = await createInventoryMovementAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Stock movement recorded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="inventory_item_id" value={inventoryItemId} />

        <div className="space-y-2">
          <Label htmlFor="movement_type">Movement Type</Label>
          <select
            id="movement_type"
            name="movement_type"
            defaultValue="stock_in"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
            <Label htmlFor="unit_cost">Unit Cost</Label>
            <input
              id="unit_cost"
              name="unit_cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_job_id">Related Field Job</Label>
          <select
            id="field_job_id"
            name="field_job_id"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">No linked field job</option>
            {fieldJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.job_number}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Textarea id="note" name="note" rows={3} />
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
          {isPending ? "Saving..." : "Record Movement"}
        </Button>
      </fieldset>
    </form>
  );
}