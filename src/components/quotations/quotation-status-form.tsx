"use client";

import { useState, useTransition } from "react";
import { updateQuotationStatusAction } from "@/lib/actions/quotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export function QuotationStatusForm({
  quotationId,
  currentStatus,
}: {
  quotationId: string;
  currentStatus: QuotationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Quotation Status</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await updateQuotationStatusAction(
                quotationId,
                formData
              );

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setSuccess("Quotation updated successfully.");
            });
          }}
          className="space-y-4"
        >
          <fieldset disabled={isPending} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={currentStatus}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
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
              {isPending ? "Updating..." : "Update Status"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}