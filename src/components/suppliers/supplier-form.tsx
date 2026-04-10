"use client";

import { useState, useTransition } from "react";
import { createSupplierAction } from "@/lib/actions/suppliers";
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

export function SupplierForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Supplier</CardTitle>
        <CardDescription>
          Add a vendor or supplier for inventory restocking.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");

            startTransition(async () => {
              const result = await createSupplierAction(formData);
              if (result?.error) setError(result.error);
            });
          }}
          className="space-y-6"
        >
          <fieldset disabled={isPending} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" name="company_name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" name="contact_person" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" rows={3} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create Supplier"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}