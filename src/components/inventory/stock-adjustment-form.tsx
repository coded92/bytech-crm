"use client";

import { useState, useTransition } from "react";
import { adjustInventoryStockAction } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function StockAdjustmentForm({
  inventoryItemId,
}: {
  inventoryItemId: string;
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
          const result = await adjustInventoryStockAction(inventoryItemId, formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Stock adjusted successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="movement_type">Adjustment Type</Label>
          <select
            id="movement_type"
            name="movement_type"
            defaultValue="adjustment"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="note">Reason / Note</Label>
          <Textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Stock count correction, damaged cable removed, new stock added..."
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
          {isPending ? "Saving..." : "Adjust Stock"}
        </Button>
      </fieldset>
    </form>
  );
}