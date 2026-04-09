"use client";

import { toggleUserActiveAction } from "@/lib/actions/users";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";

export function ToggleUserStatusButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  if (isActive) {
    return (
      <ConfirmActionButton
        label="Deactivate User"
        confirmMessage="Are you sure you want to deactivate this user?"
        action={() => toggleUserActiveAction(userId, false)}
      />
    );
  }

  return (
    <ConfirmActionButton
      label="Activate User"
      confirmMessage="Are you sure you want to activate this user?"
      action={() => toggleUserActiveAction(userId, true)}
    />
  );
}