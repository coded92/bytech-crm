"use client";

import { useState, useTransition } from "react";
import { updateInventoryItemAction } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InventoryItemData = {
  id: string;
  item_code: string;
  item_name: string;
  category:
    | "cables"
    | "printer_parts"
    | "network_devices"
    | "accessories"
    | "spare_parts"
    | "tools"
    | "consumables"
    | "other";
  sku: string | null;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  notes: string | null;
};

export function InventoryItemEditForm({
  item,
}: {
  item: InventoryItemData;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Inventory Item</CardTitle>
        <CardDescription>
          Update stock item details. Quantity changes should be done through stock adjustment.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateInventoryItemAction(item.id, formData);
              if (result?.error) setError(result.error);
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  name="item_name"
                  defaultValue={item.item_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_code">Item Code</Label>
                <Input
                  id="item_code"
                  name="item_code"
                  defaultValue={item.item_code}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={item.category}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="cables">Cables</option>
                  <option value="printer_parts">Printer Parts</option>
                  <option value="network_devices">Network Devices</option>
                  <option value="accessories">Accessories</option>
                  <option value="spare_parts">Spare Parts</option>
                  <option value="tools">Tools</option>
                  <option value="consumables">Consumables</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={item.sku ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={item.unit}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
                <Input
                  id="minimum_quantity"
                  name="minimum_quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.minimum_quantity}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  name="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={item.unit_cost}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_quantity">Current Quantity</Label>
                <Input
                  id="current_quantity"
                  name="current_quantity"
                  defaultValue={item.current_quantity}
                  disabled
                />
                <p className="text-xs text-slate-500">
                  Use stock adjustment to change quantity.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={item.notes ?? ""}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}