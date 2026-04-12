"use client";

import { useState, useTransition } from "react";
import { updatePaymentAction } from "@/lib/actions/payments";
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

type PaymentData = {
  id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: "cash" | "transfer" | "card" | "pos" | "other" | null;
  payment_reference: string | null;
  received_by: string | null;
  paid_at: string;
  notes: string | null;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function PaymentEditForm({
  payment,
}: {
  payment: PaymentData;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Payment</CardTitle>
        <CardDescription>
          Payment amount, invoice, and customer are locked to preserve accounting accuracy.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updatePaymentAction(payment.id, formData);

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  defaultValue={payment.amount}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <select
                  id="payment_method"
                  name="payment_method"
                  defaultValue={payment.payment_method ?? "transfer"}
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
                <Input
                  id="payment_reference"
                  name="payment_reference"
                  defaultValue={payment.payment_reference ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid_at">Payment Date</Label>
                <Input
                  id="paid_at"
                  name="paid_at"
                  type="datetime-local"
                  defaultValue={toDateTimeLocal(payment.paid_at)}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={payment.notes ?? ""}
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