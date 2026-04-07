"use client";

import { useState, useTransition } from "react";
import { updateCustomerStatusAction } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CustomerStatusFormProps = {
  customerId: string;
  currentStatus: "active" | "inactive" | "suspended";
  currentNotes?: string | null;
};

export function CustomerStatusForm({
  customerId,
  currentStatus,
  currentNotes,
}: CustomerStatusFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Customer</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await updateCustomerStatusAction(customerId, formData);

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setSuccess("Customer updated successfully.");
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={currentStatus}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={currentNotes || ""}
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
            {isPending ? "Updating..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}