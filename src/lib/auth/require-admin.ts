import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";

export async function requireAdmin() {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}