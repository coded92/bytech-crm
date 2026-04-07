"use client";

import { useState, useTransition } from "react";
import { recordPaymentAction } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PaymentFormProps = {
  invoiceId: string;
  customerId: string;
  balance: number;
};

export function PaymentForm({
  invoiceId,
  customerId,
  balance,
}: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await recordPaymentAction(formData);

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setSuccess("Payment recorded successfully.");
            });
          }}
          className="space-y-4"
        >
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <input type="hidden" name="customer_id" value={customerId} />

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={balance}
              required
            />
            <p className="text-xs text-slate-500">
              Outstanding balance: {formatCurrency(balance)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <select
              id="payment_method"
              name="payment_method"
              defaultValue="transfer"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
            >
              <option value="transfer">Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="pos">POS</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_reference">Payment Reference</Label>
            <Input id="payment_reference" name="payment_reference" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
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
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}