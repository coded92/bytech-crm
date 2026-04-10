"use client";

import { useState, useTransition } from "react";
import { updateSupportTicketAction } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StaffOption = {
  id: string;
  full_name: string;
};

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export function SupportUpdateForm({
  ticketId,
  currentStatus,
  currentAssignedTo,
  currentResolutionNotes,
  staff,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  currentAssignedTo: string | null;
  currentResolutionNotes: string | null;
  staff: StaffOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Ticket</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await updateSupportTicketAction(ticketId, formData);

              if (result?.error) {
                setError(result.error);
                return;
              }

              setSuccess("Ticket updated successfully.");
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={currentAssignedTo ?? ""}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Resolution Notes</Label>
              <Textarea
                id="resolution_notes"
                name="resolution_notes"
                rows={5}
                defaultValue={currentResolutionNotes ?? ""}
                placeholder="What was done to fix the issue?"
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
              {isPending ? "Updating..." : "Save Update"}
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}