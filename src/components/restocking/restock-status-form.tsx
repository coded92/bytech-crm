"use client";

import { useState, useTransition } from "react";
import { updateRestockOrderStatusAction } from "@/lib/actions/restocking";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type RestockStatus = "draft" | "ordered" | "received" | "cancelled";

export function RestockStatusForm({
  orderId,
  currentStatus,
  currentReceivedDate,
}: {
  orderId: string;
  currentStatus: RestockStatus;
  currentReceivedDate: string | null;
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
          const result = await updateRestockOrderStatusAction(orderId, formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Restock order updated successfully.");
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
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="received_date">Received Date</Label>
          <input
            id="received_date"
            name="received_date"
            type="date"
            defaultValue={currentReceivedDate || ""}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
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
          {isPending ? "Updating..." : "Update Status"}
        </Button>
      </fieldset>
    </form>
  );
}