"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logSecurityEvent } from "@/lib/security/events";
import { createClient } from "@/lib/supabase/server";
import {
  TEAM_MANAGEMENT_SETTINGS_ID,
  approvalChains,
  approvalWorkflows,
  autoAssignDepartmentModes,
  dataExportPermissionOptions,
  defaultMemberViews,
  departmentVisibilityOptions,
  integrationStatusOptions,
  salaryVisibilityOptions,
  teamManagementSettingsSchema,
  teamSettingsDateFormats,
  teamSettingsItemsPerPage,
  type TeamManagementSettingsValues,
} from "@/lib/validations/team-settings";
import { teamDepartments } from "@/lib/validations/team-management";
import type {
  CrmRole,
  TeamManagementSettings,
  TeamManagementSettingsInsert,
} from "@/types/database";

type ActionResponse = { success: true } | { error: string };

type TeamManagementSettingsPayload = TeamManagementSettingsInsert & {
  id: typeof TEAM_MANAGEMENT_SETTINGS_ID;
};

const defaultTeamManagementSettings: TeamManagementSettingsValues = {
  default_role_id: null,
  auto_assign_department_mode: "manual",
  invite_approval_enabled: true,
  team_timezone: "Africa/Lagos",
  allow_managers_invite_members: true,
  allow_team_leads_create_projects: true,
  restrict_data_access_by_department: false,
  role_inheritance_enabled: true,
  send_welcome_email: false,
  require_profile_completion: true,
  onboarding_checklist_enabled: true,
  default_onboarding_department: null,
  approval_workflow: "project_invoice_approvals",
  default_approval_chain: "manager_department_head_admin",
  escalation_hours: 48,
  auto_approve_admins: true,
  new_member_invite_alerts: true,
  role_change_alerts: true,
  department_assignment_alerts: true,
  member_deactivation_alerts: false,
  default_member_view: "card",
  items_per_page: 20,
  date_format: "DD MMM YYYY",
  show_online_status: true,
  salary_visibility: "admins_only",
  department_visibility: "all_managers",
  hide_inactive_members: false,
  data_export_permission: "admins_and_managers",
  directory_sync_status: "not_configured",
  sso_status: "not_configured",
  webhooks_status: "not_configured",
  api_access_status: "not_configured",
};

const revalidationPaths = [
  "/settings",
  "/settings/team-management",
  "/settings/roles",
  "/team-management",
  "/users",
  "/dashboard",
];

function formBoolean(formData: FormData, key: string, fallback = false) {
  const value = formData.get(key);
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function formText(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function nullableFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function settingsFromFormData(
  formData: FormData
): TeamManagementSettingsValues {
  return {
    default_role_id: nullableFormText(formData, "default_role_id"),
    auto_assign_department_mode: formText(
      formData,
      "auto_assign_department_mode",
      defaultTeamManagementSettings.auto_assign_department_mode
    ) as TeamManagementSettingsValues["auto_assign_department_mode"],
    invite_approval_enabled: formBoolean(
      formData,
      "invite_approval_enabled",
      defaultTeamManagementSettings.invite_approval_enabled
    ),
    team_timezone: formText(
      formData,
      "team_timezone",
      defaultTeamManagementSettings.team_timezone
    ),
    allow_managers_invite_members: formBoolean(
      formData,
      "allow_managers_invite_members",
      defaultTeamManagementSettings.allow_managers_invite_members
    ),
    allow_team_leads_create_projects: formBoolean(
      formData,
      "allow_team_leads_create_projects",
      defaultTeamManagementSettings.allow_team_leads_create_projects
    ),
    restrict_data_access_by_department: formBoolean(
      formData,
      "restrict_data_access_by_department",
      defaultTeamManagementSettings.restrict_data_access_by_department
    ),
    role_inheritance_enabled: formBoolean(
      formData,
      "role_inheritance_enabled",
      defaultTeamManagementSettings.role_inheritance_enabled
    ),
    send_welcome_email: formBoolean(
      formData,
      "send_welcome_email",
      defaultTeamManagementSettings.send_welcome_email
    ),
    require_profile_completion: formBoolean(
      formData,
      "require_profile_completion",
      defaultTeamManagementSettings.require_profile_completion
    ),
    onboarding_checklist_enabled: formBoolean(
      formData,
      "onboarding_checklist_enabled",
      defaultTeamManagementSettings.onboarding_checklist_enabled
    ),
    default_onboarding_department: nullableFormText(
      formData,
      "default_onboarding_department"
    ) as TeamManagementSettingsValues["default_onboarding_department"],
    approval_workflow: formText(
      formData,
      "approval_workflow",
      defaultTeamManagementSettings.approval_workflow
    ) as TeamManagementSettingsValues["approval_workflow"],
    default_approval_chain: formText(
      formData,
      "default_approval_chain",
      defaultTeamManagementSettings.default_approval_chain
    ) as TeamManagementSettingsValues["default_approval_chain"],
    escalation_hours: Number(
      formText(
        formData,
        "escalation_hours",
        String(defaultTeamManagementSettings.escalation_hours)
      )
    ),
    auto_approve_admins: formBoolean(
      formData,
      "auto_approve_admins",
      defaultTeamManagementSettings.auto_approve_admins
    ),
    new_member_invite_alerts: formBoolean(
      formData,
      "new_member_invite_alerts",
      defaultTeamManagementSettings.new_member_invite_alerts
    ),
    role_change_alerts: formBoolean(
      formData,
      "role_change_alerts",
      defaultTeamManagementSettings.role_change_alerts
    ),
    department_assignment_alerts: formBoolean(
      formData,
      "department_assignment_alerts",
      defaultTeamManagementSettings.department_assignment_alerts
    ),
    member_deactivation_alerts: formBoolean(
      formData,
      "member_deactivation_alerts",
      defaultTeamManagementSettings.member_deactivation_alerts
    ),
    default_member_view: formText(
      formData,
      "default_member_view",
      defaultTeamManagementSettings.default_member_view
    ) as TeamManagementSettingsValues["default_member_view"],
    items_per_page: Number(
      formText(
        formData,
        "items_per_page",
        String(defaultTeamManagementSettings.items_per_page)
      )
    ) as TeamManagementSettingsValues["items_per_page"],
    date_format: formText(
      formData,
      "date_format",
      defaultTeamManagementSettings.date_format
    ) as TeamManagementSettingsValues["date_format"],
    show_online_status: formBoolean(
      formData,
      "show_online_status",
      defaultTeamManagementSettings.show_online_status
    ),
    salary_visibility: formText(
      formData,
      "salary_visibility",
      defaultTeamManagementSettings.salary_visibility
    ) as TeamManagementSettingsValues["salary_visibility"],
    department_visibility: formText(
      formData,
      "department_visibility",
      defaultTeamManagementSettings.department_visibility
    ) as TeamManagementSettingsValues["department_visibility"],
    hide_inactive_members: formBoolean(
      formData,
      "hide_inactive_members",
      defaultTeamManagementSettings.hide_inactive_members
    ),
    data_export_permission: formText(
      formData,
      "data_export_permission",
      defaultTeamManagementSettings.data_export_permission
    ) as TeamManagementSettingsValues["data_export_permission"],
    directory_sync_status: formText(
      formData,
      "directory_sync_status",
      defaultTeamManagementSettings.directory_sync_status
    ) as TeamManagementSettingsValues["directory_sync_status"],
    sso_status: formText(
      formData,
      "sso_status",
      defaultTeamManagementSettings.sso_status
    ) as TeamManagementSettingsValues["sso_status"],
    webhooks_status: formText(
      formData,
      "webhooks_status",
      defaultTeamManagementSettings.webhooks_status
    ) as TeamManagementSettingsValues["webhooks_status"],
    api_access_status: formText(
      formData,
      "api_access_status",
      defaultTeamManagementSettings.api_access_status
    ) as TeamManagementSettingsValues["api_access_status"],
  };
}

function normalizeSettingsInput(input: unknown) {
  if (input instanceof FormData) {
    return settingsFromFormData(input);
  }

  return input;
}

function mergeSettings(
  settings: Partial<TeamManagementSettings> | null
): TeamManagementSettingsValues {
  return {
    ...defaultTeamManagementSettings,
    ...Object.fromEntries(
      Object.entries(settings ?? {}).filter(([, value]) => value !== null)
    ),
    default_role_id:
      settings?.default_role_id ?? defaultTeamManagementSettings.default_role_id,
    default_onboarding_department:
      settings?.default_onboarding_department ??
      defaultTeamManagementSettings.default_onboarding_department,
  } as TeamManagementSettingsValues;
}

function buildPayload(
  settings: TeamManagementSettingsValues,
  actorId: string
): TeamManagementSettingsPayload {
  return {
    id: TEAM_MANAGEMENT_SETTINGS_ID,
    ...settings,
    updated_by: actorId,
  };
}

async function writeActivityLog(args: {
  actorId: string;
  action: string;
  description: string;
}) {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_logs").insert({
    actor_id: args.actorId,
    entity_type: "team_management_settings",
    entity_id: TEAM_MANAGEMENT_SETTINGS_ID,
    action: args.action,
    description: args.description,
  });

  if (error) {
    console.error("Failed to write team settings activity log", error);
  }
}

function revalidateTeamSettingsPaths() {
  for (const path of revalidationPaths) {
    revalidatePath(path);
  }
}

export async function getTeamManagementSettingsData() {
  await requireAdmin();
  const supabase = await createClient();

  const [settingsResult, rolesResult] = await Promise.all([
    (supabase as any)
      .from("team_management_settings")
      .select("*")
      .eq("id", TEAM_MANAGEMENT_SETTINGS_ID)
      .maybeSingle(),
    (supabase as any)
      .from("crm_roles")
      .select("id, name, slug, description, role_type, role_level, is_active")
      .eq("is_active", true)
      .order("role_level", { ascending: false })
      .order("name", { ascending: true }),
  ]);

  if (settingsResult.error) {
    return { error: settingsResult.error.message };
  }

  if (rolesResult.error) {
    return { error: rolesResult.error.message };
  }

  return {
    settings: mergeSettings(settingsResult.data as TeamManagementSettings | null),
    roles: (rolesResult.data ?? []) as Pick<
      CrmRole,
      "id" | "name" | "slug" | "description" | "role_type" | "role_level" | "is_active"
    >[],
    options: {
      autoAssignDepartmentModes,
      departments: teamDepartments,
      approvalWorkflows,
      approvalChains,
      defaultMemberViews,
      itemsPerPage: teamSettingsItemsPerPage,
      dateFormats: teamSettingsDateFormats,
      salaryVisibilityOptions,
      departmentVisibilityOptions,
      dataExportPermissionOptions,
      integrationStatusOptions,
    },
    limitations: {
      send_welcome_email:
        "Stored setting only. Email invite delivery must be wired before this sends mail.",
      approval_workflow:
        "Stored setting only. Approval workflows are not enforced until workflow actions consume it.",
      directory_sync_status:
        "Configuration status only. Directory sync/OAuth is not implemented here.",
      sso_status:
        "Configuration status only. Supabase Auth remains the active login system.",
      webhooks_status:
        "Configuration status only. No webhook delivery is implemented here.",
      api_access_status:
        "Configuration status only. No API key issuance is implemented here.",
    },
  };
}

export async function updateTeamManagementSettingsAction(
  input: unknown
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const parsed = teamManagementSettingsSchema.safeParse(
    normalizeSettingsInput(input)
  );

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Invalid team management settings",
    };
  }

  if (parsed.data.default_role_id) {
    const { data: role, error: roleError } = await (supabase as any)
      .from("crm_roles")
      .select("id, is_active")
      .eq("id", parsed.data.default_role_id)
      .single();

    if (roleError || !role || role.is_active !== true) {
      return { error: "Default role must be an active CRM role." };
    }
  }

  const payload = buildPayload(parsed.data, admin.id);
  const { data: existing } = await (supabase as any)
    .from("team_management_settings")
    .select("id")
    .eq("id", TEAM_MANAGEMENT_SETTINGS_ID)
    .maybeSingle();

  const mutation = existing
    ? (supabase as any)
        .from("team_management_settings")
        .update(payload)
        .eq("id", TEAM_MANAGEMENT_SETTINGS_ID)
    : (supabase as any)
        .from("team_management_settings")
        .insert({ ...payload, created_by: admin.id });

  const { error } = await mutation;

  if (error) {
    return { error: error.message };
  }

  await writeActivityLog({
    actorId: admin.id,
    action: "team_management_settings_updated",
    description: "Updated team management settings",
  });

  await logSecurityEvent({
    userId: admin.id,
    eventType: "team_management_settings_updated",
    metadata: {
      default_role_id: parsed.data.default_role_id,
      auto_assign_department_mode: parsed.data.auto_assign_department_mode,
      invite_approval_enabled: parsed.data.invite_approval_enabled,
      restrict_data_access_by_department:
        parsed.data.restrict_data_access_by_department,
      approval_workflow: parsed.data.approval_workflow,
      default_member_view: parsed.data.default_member_view,
      data_export_permission: parsed.data.data_export_permission,
    },
  });

  revalidateTeamSettingsPaths();

  return { success: true };
}

export async function resetTeamManagementSettingsAction(): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const payload = buildPayload(defaultTeamManagementSettings, admin.id);

  const { error } = await (supabase as any)
    .from("team_management_settings")
    .upsert(
      { ...payload, created_by: admin.id },
      { onConflict: "id" }
    );

  if (error) {
    return { error: error.message };
  }

  await writeActivityLog({
    actorId: admin.id,
    action: "team_management_settings_reset",
    description: "Reset team management settings to defaults",
  });

  await logSecurityEvent({
    userId: admin.id,
    eventType: "team_management_settings_updated",
    metadata: { action: "reset_to_defaults" },
  });

  revalidateTeamSettingsPaths();

  return { success: true };
}
