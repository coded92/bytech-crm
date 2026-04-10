"use client";

import { useState, useTransition } from "react";
import { createRepairHistoryAction } from "@/lib/actions/repair-history";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StaffOption = {
  id: string;
  full_name: string;
};

export function RepairHistoryForm({
  assetId,
  supportTicketId,
  staff,
}: {
  assetId: string;
  supportTicketId?: string | null;
  staff: StaffOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={(formData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
          const result = await createRepairHistoryAction(formData);

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Repair history added successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input type="hidden" name="asset_id" value={assetId} />
        <input
          type="hidden"
          name="support_ticket_id"
          value={supportTicketId || ""}
        />

        <div className="space-y-2">
          <Label htmlFor="repair_title">Repair Title</Label>
          <input
            id="repair_title"
            name="repair_title"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="Printer head replacement"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair_type">Repair Type</Label>
          <select
            id="repair_type"
            name="repair_type"
            defaultValue="repair"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="inspection">Inspection</option>
            <option value="repair">Repair</option>
            <option value="replacement">Replacement</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair_status">Repair Status</Label>
          <select
            id="repair_status"
            name="repair_status"
            defaultValue="completed"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="technician_id">Technician</Label>
          <select
            id="technician_id"
            name="technician_id"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select technician</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Repair Cost</Label>
          <input
            id="cost"
            name="cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="repair_date">Repair Date</Label>
          <input
            id="repair_date"
            name="repair_date"
            type="date"
            defaultValue={today}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={4} />
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
          {isPending ? "Saving..." : "Add Repair History"}
        </Button>
      </fieldset>
    </form>
  );
}