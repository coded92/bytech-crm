"use client";

import { archiveAssetAction } from "@/lib/actions/assets";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";

export function ArchiveAssetButton({ assetId }: { assetId: string }) {
  return (
    <ConfirmActionButton
      label="Archive Asset"
      confirmMessage="Are you sure you want to archive this asset?"
      action={() => archiveAssetAction(assetId)}
    />
  );
}