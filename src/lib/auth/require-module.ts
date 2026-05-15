import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";

const moduleAliases: Record<string, string> = {
  "audit-logs": "audit_logs",
  "field-jobs": "field_jobs",
};

function normalizeModuleName(moduleName: string) {
  return moduleAliases[moduleName] ?? moduleName;
}

export async function requireModule(moduleName: string) {
  const profile = await requireProfile();
  const normalizedModuleName = normalizeModuleName(moduleName);

  // admin can access everything
  if (profile.role === "admin") {
    return profile;
  }

  // staff must have module permission
  if (!profile.allowed_modules.includes(normalizedModuleName)) {
    redirect("/dashboard");
  }

  return profile;
}
