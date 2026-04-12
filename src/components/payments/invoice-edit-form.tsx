"use client";

import { useState, useTransition } from "react";
import { updateInvoiceAction } from "@/lib/actions/payments";
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

type CustomerOption = {
  id: string;
  company_name: string;
};

type QuotationOption = {
  id: string;
  quote_number: string;
  company_name?: string | null;
};

type InvoiceData = {
  id: string;
  customer_id: string;
  quotation_id: string | null;
  invoice_type: "setup_fee" | "subscription" | "custom";
  amount: number;
  amount_paid: number;
  due_date: string;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  billing_period_start: string | null;
  billing_period_end: string | null;
  reference: string | null;
  notes: string | null;
};

type InvoiceEditFormProps = {
  invoice: InvoiceData;
  customers: CustomerOption[];
  quotations: QuotationOption[];
};

export function InvoiceEditForm({
  invoice,
  customers,
  quotations,
}: InvoiceEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Invoice</CardTitle>
        <CardDescription>
          Update invoice information. Recorded payments will remain unchanged.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateInvoiceAction(invoice.id, formData);

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
                <Label htmlFor="customer_id">Customer</Label>
                <select
                  id="customer_id"
                  name="customer_id"
                  defaultValue={invoice.customer_id}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotation_id">Quotation</Label>
                <select
                  id="quotation_id"
                  name="quotation_id"
                  defaultValue={invoice.quotation_id ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No linked quotation</option>
                  {quotations.map((quotation) => (
                    <option key={quotation.id} value={quotation.id}>
                      {quotation.quote_number}
                      {quotation.company_name ? ` - ${quotation.company_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_type">Invoice Type</Label>
                <select
                  id="invoice_type"
                  name="invoice_type"
                  defaultValue={invoice.invoice_type}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="setup_fee">Setup Fee</option>
                  <option value="subscription">Subscription</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={invoice.amount}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  name="due_date"
                  type="date"
                  defaultValue={invoice.due_date}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={invoice.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="waived">Waived</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  name="reference"
                  defaultValue={invoice.reference ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_period_start">Billing Start</Label>
                <Input
                  id="billing_period_start"
                  name="billing_period_start"
                  type="date"
                  defaultValue={invoice.billing_period_start ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_period_end">Billing End</Label>
                <Input
                  id="billing_period_end"
                  name="billing_period_end"
                  type="date"
                  defaultValue={invoice.billing_period_end ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={invoice.notes ?? ""}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-medium">Amount Paid:</span> {invoice.amount_paid}
              </p>
              <p className="mt-1">
                Balance will be recalculated automatically from the updated amount.
              </p>
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