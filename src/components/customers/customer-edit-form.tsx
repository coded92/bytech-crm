"use client";

import { useState, useTransition } from "react";
import { updateCustomerAction } from "@/lib/actions/customers";
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

type CustomerData = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  plan_type: "cloud" | "offline" | null;
  billing_cycle: "monthly" | "quarterly" | "yearly" | "one_time" | null;
  subscription_amount: number;
  setup_fee: number;
  status: "active" | "inactive" | "suspended";
  notes: string | null;
};

export function CustomerEditForm({ customer }: { customer: CustomerData }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Customer</CardTitle>
        <CardDescription>
          Update customer details, plan, and billing settings.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await updateCustomerAction(customer.id, formData);

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={customer.company_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  defaultValue={customer.contact_person ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={customer.phone ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={customer.email ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Input
                  id="business_type"
                  name="business_type"
                  defaultValue={customer.business_type ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={customer.status}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan_type">Plan Type</Label>
                <select
                  id="plan_type"
                  name="plan_type"
                  defaultValue={customer.plan_type ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No plan yet</option>
                  <option value="cloud">Cloud</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <select
                  id="billing_cycle"
                  name="billing_cycle"
                  defaultValue={customer.billing_cycle ?? ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No billing yet</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One Time</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_amount">Subscription Amount</Label>
                <Input
                  id="subscription_amount"
                  name="subscription_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={customer.subscription_amount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup_fee">Setup Fee</Label>
                <Input
                  id="setup_fee"
                  name="setup_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={customer.setup_fee}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={customer.city ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={customer.state ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  defaultValue={customer.address ?? ""}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={customer.notes ?? ""}
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