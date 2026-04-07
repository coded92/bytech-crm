import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import type { Profile } from "@/types/database";

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}