import { z } from "zod";
import { teamDepartments } from "@/lib/validations/team-management";

export const TEAM_MANAGEMENT_SETTINGS_ID =
  "00000000-0000-0000-0000-000000000001" as const;

export const autoAssignDepartmentModes = [
  "manual",
  "profile_department",
  "email_domain",
] as const;

export const approvalWorkflows = [
  "disabled",
  "project_invoice_approvals",
  "all_financial_approvals",
  "custom",
] as const;

export const approvalChains = [
  "manager",
  "department_head_admin",
  "manager_department_head_admin",
  "admin_only",
] as const;

export const defaultMemberViews = ["card", "table", "compact"] as const;

export const teamSettingsItemsPerPage = [10, 20, 25, 50, 100] as const;

export const teamSettingsDateFormats = [
  "DD MMM YYYY",
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
] as const;

export const salaryVisibilityOptions = [
  "admins_only",
  "admins_and_hr",
  "admins_and_managers",
  "hidden",
] as const;

export const departmentVisibilityOptions = [
  "all_managers",
  "same_department",
  "admins_only",
] as const;

export const dataExportPermissionOptions = [
  "admins_only",
  "admins_and_managers",
  "disabled",
] as const;

export const integrationStatusOptions = [
  "not_configured",
  "configured",
  "disabled",
] as const;

const nullableUuidSchema = z.string().uuid("Invalid role id").nullable();
const itemsPerPageSchema = z.coerce
  .number()
  .pipe(z.union([z.literal(10), z.literal(20), z.literal(25), z.literal(50), z.literal(100)]));

export const teamManagementSettingsSchema = z.object({
  default_role_id: nullableUuidSchema,
  auto_assign_department_mode: z.enum(autoAssignDepartmentModes),
  invite_approval_enabled: z.boolean(),
  team_timezone: z.string().trim().min(1).max(80),
  allow_managers_invite_members: z.boolean(),
  allow_team_leads_create_projects: z.boolean(),
  restrict_data_access_by_department: z.boolean(),
  role_inheritance_enabled: z.boolean(),
  send_welcome_email: z.boolean(),
  require_profile_completion: z.boolean(),
  onboarding_checklist_enabled: z.boolean(),
  default_onboarding_department: z.enum(teamDepartments).nullable(),
  approval_workflow: z.enum(approvalWorkflows),
  default_approval_chain: z.enum(approvalChains),
  escalation_hours: z.coerce
    .number()
    .int()
    .min(1, "Escalation rule must be at least 1 hour")
    .max(720, "Escalation rule cannot exceed 720 hours"),
  auto_approve_admins: z.boolean(),
  new_member_invite_alerts: z.boolean(),
  role_change_alerts: z.boolean(),
  department_assignment_alerts: z.boolean(),
  member_deactivation_alerts: z.boolean(),
  default_member_view: z.enum(defaultMemberViews),
  items_per_page: itemsPerPageSchema,
  date_format: z.enum(teamSettingsDateFormats),
  show_online_status: z.boolean(),
  salary_visibility: z.enum(salaryVisibilityOptions),
  department_visibility: z.enum(departmentVisibilityOptions),
  hide_inactive_members: z.boolean(),
  data_export_permission: z.enum(dataExportPermissionOptions),
  directory_sync_status: z.enum(integrationStatusOptions),
  sso_status: z.enum(integrationStatusOptions),
  webhooks_status: z.enum(integrationStatusOptions),
  api_access_status: z.enum(integrationStatusOptions),
});

export type TeamManagementSettingsValues = z.infer<
  typeof teamManagementSettingsSchema
>;
