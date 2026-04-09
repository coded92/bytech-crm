"use client";

import { deleteSupportTicketAction } from "@/lib/actions/support";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";

export function DeleteSupportTicketButton({
  ticketId,
}: {
  ticketId: string;
}) {
  return (
    <ConfirmActionButton
      label="Delete Ticket"
      confirmMessage="Are you sure you want to permanently delete this support ticket?"
      action={async () => {
        const result = await deleteSupportTicketAction(ticketId);

        if (result?.success) {
          window.location.href = "/support";
        }

        return result;
      }}
      variant="destructive"
    />
  );
}