"use client";

import { createInvoiceAction } from "@/lib/actions/payments";
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

type InvoiceFormProps = {
  customers: CustomerOption[];
  quotations: QuotationOption[];
  prefilledCustomerId?: string;
  prefilledQuotationId?: string;
};

export function InvoiceForm({
  customers,
  quotations,
  prefilledCustomerId = "",
  prefilledQuotationId = "",
}: InvoiceFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
        <CardDescription>
          Create a setup fee, subscription, or custom invoice.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={createInvoiceAction as any} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <select
                id="customer_id"
                name="customer_id"
                defaultValue={prefilledCustomerId}
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
                defaultValue={prefilledQuotationId}
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
                defaultValue="custom"
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" name="due_date" type="date" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                name="reference"
                placeholder="Optional internal reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_period_start">Billing Start</Label>
              <Input
                id="billing_period_start"
                name="billing_period_start"
                type="date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_period_end">Billing End</Label>
              <Input
                id="billing_period_end"
                name="billing_period_end"
                type="date"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Optional note for this invoice"
              />
            </div>
          </div>

          <Button type="submit">Create Invoice</Button>
        </form>
      </CardContent>
    </Card>
  );
}