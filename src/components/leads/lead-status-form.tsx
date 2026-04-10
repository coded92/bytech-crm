"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusAction } from "@/lib/actions/leads";
import { toDateTimeLocal } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LeadStatusFormProps = {
  leadId: string;
  currentStatus: string;
  currentLostReason?: string | null;
  currentFollowUp?: string | null;
};

export function LeadStatusForm({
  leadId,
  currentStatus,
  currentLostReason,
  currentFollowUp,
}: LeadStatusFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Lead Status</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={(formData) => {
            setError("");
            setSuccess("");

            startTransition(async () => {
              const result = await updateLeadStatusAction(leadId, formData);

              const errorMessage = "error" in result ? result.error : null;

              if (errorMessage) {
                setError(errorMessage);
                return;
              }

              setSuccess("Lead updated successfully.");
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
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="follow_up">Follow-up</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_follow_up_at">Next Follow-up</Label>
              <input
                id="next_follow_up_at"
                name="next_follow_up_at"
                type="datetime-local"
                defaultValue={toDateTimeLocal(currentFollowUp)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lost_reason">Lost Reason</Label>
              <Textarea
                id="lost_reason"
                name="lost_reason"
                defaultValue={currentLostReason || ""}
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
      </CardContent>
    </Card>
  );
}