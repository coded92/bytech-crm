import { z } from "zod";

export const crmModuleNames = [
  "dashboard",
  "leads",
  "customers",
  "quotations",
  "invoices",
  "payments",
  "tasks",
  "projects",
  "reports",
  "support",
  "notifications",
  "deployments",
  "assets",
  "field_jobs",
  "engineer_daily",
  "inventory",
  "suppliers",
  "supplier_payables",
  "restocking",
  "expenses",
  "audit_logs",
  "users",
  "settings",
  "search",
  "messages",
] as const;

export const teamDepartments = [
  "sales",
  "operations",
  "support",
  "engineering",
  "inventory",
  "finance",
  "hr",
] as const;

export const crmAccessLevels = [
  "full_access",
  "edit",
  "view_only",
  "no_access",
  "not_applicable",
] as const;

const nullableUuidSchema = z
  .string()
  .uuid("Invalid identifier")
  .nullable()
  .optional();

const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color");

const baseNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be 80 characters or fewer");

export const teamSchema = z.object({
  name: baseNameSchema,
  description: z.string().trim().max(300).optional().nullable(),
  department: z.enum(teamDepartments).optional().nullable(),
  icon: z.string().trim().min(1).max(40).default("users"),
  color: colorSchema.default("#4F46E5"),
  team_lead_id: nullableUuidSchema,
  is_active: z.boolean().default(true),
});

export const updateTeamSchema = teamSchema.extend({
  id: z.string().uuid("Invalid team id"),
});

export const teamMemberSchema = z.object({
  team_id: z.string().uuid("Invalid team id"),
  profile_id: z.string().uuid("Invalid user id"),
  team_role: z.enum(["lead", "member"]).default("member"),
});

export const removeTeamMemberSchema = z.object({
  team_member_id: z.string().uuid("Invalid team member id"),
});

export const crmRoleSchema = z.object({
  name: baseNameSchema,
  description: z.string().trim().max(300).optional().nullable(),
  parent_role_id: nullableUuidSchema,
  role_level: z.coerce
    .number()
    .int()
    .min(0, "Role level must be positive")
    .max(1000, "Role level is too high")
    .default(50),
  icon: z.string().trim().min(1).max(40).default("shield"),
  color: colorSchema.default("#4F46E5"),
  is_active: z.boolean().default(true),
});

export const updateCrmRoleSchema = crmRoleSchema.extend({
  id: z.string().uuid("Invalid role id"),
});

export const assignProfileRoleSchema = z.object({
  profile_id: z.string().uuid("Invalid user id"),
  role_id: z.string().uuid("Invalid role id"),
  is_primary: z.boolean().default(true),
});

export const permissionRuleSchema = z.object({
  module_name: z.enum(crmModuleNames),
  access_level: z.enum(crmAccessLevels),
  can_read: z.boolean().optional(),
  can_create: z.boolean().optional(),
  can_update: z.boolean().optional(),
  can_delete: z.boolean().optional(),
  can_approve: z.boolean().optional(),
  can_export: z.boolean().optional(),
  can_admin: z.boolean().optional(),
});

export const updateRolePermissionsSchema = z.object({
  role_id: z.string().uuid("Invalid role id"),
  rules: z.array(permissionRuleSchema).min(1, "At least one rule is required"),
});

export const permissionSetSchema = z.object({
  name: baseNameSchema,
  description: z.string().trim().max(300).optional().nullable(),
  icon: z.string().trim().min(1).max(40).default("shield"),
  color: colorSchema.default("#4F46E5"),
  is_active: z.boolean().default(true),
  rules: z.array(permissionRuleSchema).default([]),
});

export const updatePermissionSetSchema = permissionSetSchema.extend({
  id: z.string().uuid("Invalid permission set id"),
});

export const assignPermissionSetToRoleSchema = z.object({
  role_id: z.string().uuid("Invalid role id"),
  permission_set_id: z.string().uuid("Invalid permission set id"),
});

export const inviteMemberSchema = z.object({
  full_name: baseNameSchema,
  email: z.string().trim().email("Enter a valid email address"),
  department: z.enum(teamDepartments).optional().nullable(),
  job_title: z.string().trim().max(120).optional().nullable(),
  role_id: nullableUuidSchema,
  team_id: nullableUuidSchema,
  delivery_method: z.enum(["email", "link"]).default("email"),
  expires_in_days: z.coerce
    .number()
    .int()
    .min(1, "Invites must last at least 1 day")
    .max(30, "Invites cannot last more than 30 days")
    .default(7),
});

export type TeamValues = z.infer<typeof teamSchema>;
export type UpdateTeamValues = z.infer<typeof updateTeamSchema>;
export type TeamMemberValues = z.infer<typeof teamMemberSchema>;
export type CrmRoleValues = z.infer<typeof crmRoleSchema>;
export type UpdateCrmRoleValues = z.infer<typeof updateCrmRoleSchema>;
export type AssignProfileRoleValues = z.infer<typeof assignProfileRoleSchema>;
export type PermissionRuleValues = z.infer<typeof permissionRuleSchema>;
export type UpdateRolePermissionsValues = z.infer<
  typeof updateRolePermissionsSchema
>;
export type PermissionSetValues = z.infer<typeof permissionSetSchema>;
export type UpdatePermissionSetValues = z.infer<
  typeof updatePermissionSetSchema
>;
export type AssignPermissionSetToRoleValues = z.infer<
  typeof assignPermissionSetToRoleSchema
>;
export type InviteMemberValues = z.infer<typeof inviteMemberSchema>;
