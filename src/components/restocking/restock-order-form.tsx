"use client";

import { useState, useTransition } from "react";
import { createRestockOrderAction } from "@/lib/actions/restocking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SupplierOption = {
  id: string;
  company_name: string;
};

type InventoryItemOption = {
  id: string;
  item_name: string;
  item_code: string;
};

type RestockItem = {
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  notes: string;
};

export function RestockOrderForm({
  suppliers,
  inventoryItems,
}: {
  suppliers: SupplierOption[];
  inventoryItems: InventoryItemOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [items, setItems] = useState<RestockItem[]>([
    { inventory_item_id: "", quantity: 1, unit_cost: 0, notes: "" },
  ]);

  function updateItem(
    index: number,
    field: keyof RestockItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { inventory_item_id: "", quantity: 1, unit_cost: 0, notes: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Restock Order</CardTitle>
        <CardDescription>
          Record a purchase or stock replenishment order.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await createRestockOrderAction(formData);
              if (result?.error) setError(result.error);
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <input type="hidden" name="items" value={JSON.stringify(items)} readOnly />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier</Label>
                <select
                  id="supplier_id"
                  name="supplier_id"
                  defaultValue=""
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No supplier selected</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_date">Expected Date</Label>
                <Input id="expected_date" name="expected_date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_date">Received Date</Label>
                <Input id="received_date" name="received_date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Restock Items</h3>
                <Button type="button" variant="outline" onClick={addItem}>
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-12"
                >
                  <div className="space-y-2 md:col-span-4">
                    <Label>Inventory Item</Label>
                    <select
                      value={item.inventory_item_id}
                      onChange={(e) =>
                        updateItem(index, "inventory_item_id", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select item</option>
                      {inventoryItems.map((inventoryItem) => (
                        <option key={inventoryItem.id} value={inventoryItem.id}>
                          {inventoryItem.item_name} ({inventoryItem.item_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateItem(index, "unit_cost", Number(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label>Notes</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(index, "notes", e.target.value)}
                    />
                  </div>

                  <div className="flex items-end md:col-span-1">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1 || isPending}
                      className="w-full"
                    >
                      X
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Restock Order"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}