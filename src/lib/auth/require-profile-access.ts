import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";
import type { Profile } from "@/types/database";

export type ProfileAccess = {
  currentProfile: Profile;
  targetProfileId: string;
  isOwnProfile: boolean;
  isAdmin: boolean;
  canManageProfile: boolean;
};

export async function requireProfileAccess(
  targetProfileId: string
): Promise<ProfileAccess> {
  const currentProfile = await requireProfile();
  const isAdmin = currentProfile.role === "admin";
  const isOwnProfile = currentProfile.id === targetProfileId;

  if (!isAdmin && !isOwnProfile) {
    redirect("/dashboard");
  }

  return {
    currentProfile,
    targetProfileId,
    isOwnProfile,
    isAdmin,
    canManageProfile: isAdmin,
  };
}
