"use client";

import { useState, useTransition } from "react";
import { createFieldJobInventoryUsageAction } from "@/lib/actions/field-job-inventory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InventoryItemOption = {
  id: string;
  item_name: string;
  item_code: string;
  current_quantity: number;
  unit: string;
};

export function FieldJobInventoryUsageForm({
  fieldJobId,
  inventoryItems,
}: {
  fieldJobId: string;
  inventoryItems: InventoryItemOption[];
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
          const result = await createFieldJobInventoryUsageAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Inventory usage recorded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="field_job_id" value={fieldJobId} />

        <div className="space-y-2">
          <Label htmlFor="inventory_item_id">Inventory Item</Label>
          <select
            id="inventory_item_id"
            name="inventory_item_id"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select item</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name} ({item.item_code}) - {item.current_quantity} {item.unit}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity Used</Label>
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
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Used for wiring repair / printer fix..."
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
          {isPending ? "Saving..." : "Issue Inventory"}
        </Button>
      </fieldset>
    </form>
  );
}