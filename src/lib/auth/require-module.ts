import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";

export async function requireModule(moduleName: string) {
  const profile = await requireProfile();

  // admin can access everything
  if (profile.role === "admin") {
    return profile;
  }

  // staff must have module permission
  if (!profile.allowed_modules.includes(moduleName)) {
    redirect("/dashboard");
  }

  return profile;
}