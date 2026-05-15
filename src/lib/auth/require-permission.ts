import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/require-profile";
import type { Profile } from "@/types/database";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "admin";

const staffAllowedActions = new Set<PermissionAction>([
  "read",
  "create",
  "update",
]);

const relatedTableModuleMap: Record<string, string> = {
  assets: "assets",
  customers: "customers",
  daily_reports: "reports",
  expenses: "expenses",
  field_jobs: "field_jobs",
  field_job_inventory_usage: "field_jobs",
  field_job_materials: "field_jobs",
  field_job_photos: "field_jobs",
  field_job_updates: "field_jobs",
  inventory_items: "inventory",
  inventory_movements: "inventory",
  inventory_restock_orders: "restocking",
  leads: "leads",
  payment_invoices: "invoices",
  payment_transactions: "payments",
  project_tasks: "projects",
  projects: "projects",
  quotations: "quotations",
  receipts: "payments",
  restocking: "restocking",
  support_tickets: "support",
  tasks: "tasks",
};

export function getModuleForRelatedTable(relatedTable: string) {
  return relatedTableModuleMap[relatedTable] ?? "attachments";
}

export async function requirePermission(
  moduleName: string,
  action: PermissionAction
): Promise<Profile> {
  const profile = await requireProfile();

  if (profile.role === "admin") {
    return profile;
  }

  const hasModuleAccess = profile.allowed_modules.includes(moduleName);
  const hasActionAccess = staffAllowedActions.has(action);

  if (!hasModuleAccess || !hasActionAccess) {
    redirect("/dashboard");
  }

  return profile;
}
