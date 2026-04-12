"use client";

import { useState, useTransition } from "react";
import { createSupplierPurchaseExpenseAction } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupplierPaymentForm({
  supplierId,
  restockOrderId,
  balanceDue,
}: {
  supplierId: string;
  restockOrderId: string;
  balanceDue: number;
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
          const result = await createSupplierPurchaseExpenseAction(formData);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setSuccess("Supplier payment recorded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="supplier_id" value={supplierId} />
        <input type="hidden" name="restock_order_id" value={restockOrderId} />

        <div className="space-y-2">
          <Label htmlFor="amount">Amount Paid</Label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={balanceDue > 0 ? balanceDue : 0}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
          <p className="text-xs text-slate-500">
            Current balance due: {balanceDue.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense_date">Payment Date</Label>
          <input
            id="expense_date"
            name="expense_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue="transfer"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="transfer">Transfer</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Payment for supplier restock order"
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
          {isPending ? "Recording..." : "Record Supplier Payment"}
        </Button>
      </fieldset>
    </form>
  );
}