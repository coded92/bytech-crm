"use client";

import { archiveDeploymentAction } from "@/lib/actions/deployments";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";

export function ArchiveDeploymentButton({
  deploymentId,
}: {
  deploymentId: string;
}) {
  return (
    <ConfirmActionButton
      label="Cancel Deployment"
      confirmMessage="Are you sure you want to cancel this deployment?"
      action={() => archiveDeploymentAction(deploymentId)}
    />
  );
}