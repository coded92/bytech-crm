"use client";

import { useState, useTransition } from "react";
import { convertLeadToCustomerAction } from "@/lib/actions/customers";
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

type ConvertLeadFormProps = {
  leadId: string;
  companyName: string;
};

export function ConvertLeadForm({
  leadId,
  companyName,
}: ConvertLeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convert Lead to Customer</CardTitle>
        <CardDescription>
          Create a customer account for {companyName}.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await convertLeadToCustomerAction(
                leadId,
                formData
              );

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
          className="space-y-5"
        >
          <fieldset disabled={isPending} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <select
                id="plan_type"
                name="plan_type"
                defaultValue="cloud"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              >
                <option value="cloud">Cloud</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setup_fee">Setup Fee</Label>
                <Input
                  id="setup_fee"
                  name="setup_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_amount">
                  Subscription Amount
                </Label>
                <Input
                  id="subscription_amount"
                  name="subscription_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing Cycle</Label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                defaultValue="monthly"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Converting..." : "Convert to Customer"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}