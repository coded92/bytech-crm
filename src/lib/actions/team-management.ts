"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/events";
import {
  assignPermissionSetToRoleSchema,
  assignProfileRoleSchema,
  crmRoleSchema,
  inviteMemberSchema,
  permissionSetSchema,
  teamMemberSchema,
  teamSchema,
  updateCrmRoleSchema,
  updatePermissionSetSchema,
  updateRolePermissionsSchema,
  updateTeamSchema,
  type PermissionRuleValues,
} from "@/lib/validations/team-management";
import type { CrmAccessLevel } from "@/types/database";

type ActionResponse =
  | { success: true; id?: string; inviteLink?: string }
  | { error: string };

type AdminContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
  profile: {
    id: string;
    role: "admin" | "staff";
    full_name: string | null;
    email: string | null;
  };
};

const userManagementPaths = [
  "/users",
  "/team-management",
  "/settings/team-management",
  "/settings/roles",
  "/settings/permissions",
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildInviteLink(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  return `${siteUrl.replace(/\/$/, "")}/accept-invite?token=${token}`;
}

function getInviteExpiry(days: number) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function normalizePermissionRule(rule: PermissionRuleValues) {
  const defaults = getDefaultPermissionFlags(rule.access_level);

  return {
    module_name: rule.module_name,
    access_level: rule.access_level,
    can_read: rule.can_read ?? defaults.can_read,
    can_create: rule.can_create ?? defaults.can_create,
    can_update: rule.can_update ?? defaults.can_update,
    can_delete: rule.can_delete ?? defaults.can_delete,
    can_approve: rule.can_approve ?? defaults.can_approve,
    can_export: rule.can_export ?? defaults.can_export,
    can_admin: rule.can_admin ?? defaults.can_admin,
  };
}

function getDefaultPermissionFlags(accessLevel: CrmAccessLevel) {
  switch (accessLevel) {
    case "full_access":
      return {
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: true,
        can_approve: true,
        can_export: true,
        can_admin: true,
      };
    case "edit":
      return {
        can_read: true,
        can_create: true,
        can_update: true,
        can_delete: false,
        can_approve: false,
        can_export: false,
        can_admin: false,
      };
    case "view_only":
      return {
        can_read: true,
        can_create: false,
        can_update: false,
        can_delete: false,
        can_approve: false,
        can_export: false,
        can_admin: false,
      };
    case "no_access":
    case "not_applicable":
    default:
      return {
        can_read: false,
        can_create: false,
        can_update: false,
        can_delete: false,
        can_approve: false,
        can_export: false,
        can_admin: false,
      };
  }
}

async function requireAdminContext(): Promise<
  | { error: null; context: AdminContext }
  | { error: string; context: null }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", context: null };
  }

  const { data: profile, error } = await (supabase as any)
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    return { error: "Only admins can perform this action.", context: null };
  }

  return {
    error: null,
    context: {
      supabase,
      user: { id: user.id },
      profile,
    },
  };
}

async function writeActivityLog(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
}) {
  const { error } = await (args.supabase as any).from("activity_logs").insert({
    actor_id: args.actorId,
    entity_type: args.entityType,
    entity_id: args.entityId,
    action: args.action,
    description: args.description,
  });

  if (error) {
    console.error("Failed to write team management activity log", error);
  }
}

function revalidateUserManagementPaths() {
  for (const path of userManagementPaths) {
    revalidatePath(path);
  }
}

export async function getTeamManagementData() {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error };
  }

  const { supabase } = ctx.context;

  const [
    profilesResult,
    rolesResult,
    profileRolesResult,
    teamsResult,
    teamMembersResult,
    permissionSetsResult,
    permissionRulesResult,
    rolePermissionsResult,
    rolePermissionSetsResult,
    permissionActivityEventsResult,
    invitationsResult,
    activeSessionsResult,
  ] = await Promise.all([
    (supabase as any)
      .from("profiles")
      .select(
        "id, full_name, first_name, last_name, email, role, department, job_title, avatar_url, is_active, created_at, updated_at"
      )
      .order("full_name", { ascending: true }),
    (supabase as any)
      .from("crm_roles")
      .select(
        "id, name, slug, description, role_type, role_level, parent_role_id, icon, color, is_active, is_system, created_by, created_at, updated_at"
      )
      .order("role_level", { ascending: false })
      .order("name", { ascending: true }),
    (supabase as any)
      .from("profile_roles")
      .select("id, profile_id, role_id, is_primary, assigned_by, assigned_at, created_at"),
    (supabase as any)
      .from("teams")
      .select(
        "id, name, slug, description, department, icon, color, team_lead_id, is_active, created_by, created_at, updated_at"
      )
      .order("name", { ascending: true }),
    (supabase as any)
      .from("team_members")
      .select("id, team_id, profile_id, team_role, added_by, joined_at, created_at"),
    (supabase as any)
      .from("crm_permission_sets")
      .select(
        "id, name, slug, description, icon, color, is_system, is_active, created_by, created_at, updated_at"
      )
      .order("is_system", { ascending: false })
      .order("name", { ascending: true }),
    (supabase as any)
      .from("crm_permission_set_rules")
      .select(
        "id, permission_set_id, module_name, access_level, can_read, can_create, can_update, can_delete, can_approve, can_export, can_admin, created_at, updated_at"
      ),
    (supabase as any)
      .from("crm_role_permissions")
      .select(
        "id, role_id, module_name, access_level, can_read, can_create, can_update, can_delete, can_approve, can_export, can_admin, created_at, updated_at"
      ),
    (supabase as any)
      .from("crm_role_permission_sets")
      .select("role_id, permission_set_id, assigned_by, assigned_at"),
    (supabase as any)
      .from("user_security_events")
      .select("id, user_id, event_type, ip_address, metadata, created_at")
      .in("event_type", [
        "permission_set_created",
        "permission_set_updated",
        "role_permission_updated",
      ])
      .order("created_at", { ascending: false })
      .limit(100),
    (supabase as any)
      .from("user_invitations")
      .select(
        "id, email, full_name, department, job_title, role_id, team_id, delivery_method, status, invited_by, accepted_by, invited_at, accepted_at, expires_at, created_at, updated_at"
      )
      .order("invited_at", { ascending: false }),
    (supabase as any)
      .from("user_active_sessions")
      .select("user_id, last_seen_at, status")
      .order("last_seen_at", { ascending: false }),
  ]);

  const firstError =
    profilesResult.error ||
    rolesResult.error ||
    profileRolesResult.error ||
    teamsResult.error ||
    teamMembersResult.error ||
    permissionSetsResult.error ||
    permissionRulesResult.error ||
    rolePermissionsResult.error ||
    rolePermissionSetsResult.error ||
    permissionActivityEventsResult.error ||
    invitationsResult.error ||
    activeSessionsResult.error;

  if (firstError) {
    return { error: firstError.message };
  }

  return {
    profiles: profilesResult.data ?? [],
    roles: rolesResult.data ?? [],
    profileRoles: profileRolesResult.data ?? [],
    teams: teamsResult.data ?? [],
    teamMembers: teamMembersResult.data ?? [],
    permissionSets: permissionSetsResult.data ?? [],
    permissionSetRules: permissionRulesResult.data ?? [],
    rolePermissions: rolePermissionsResult.data ?? [],
    rolePermissionSets: rolePermissionSetsResult.data ?? [],
    permissionActivityEvents: permissionActivityEventsResult.data ?? [],
    invitations: invitationsResult.data ?? [],
    activeSessions: activeSessionsResult.data ?? [],
  };
}

export async function createTeamAction(values: unknown): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = teamSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid team data" };
  }

  const { supabase, user } = ctx.context;
  const row = {
    ...parsed.data,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
    department: parsed.data.department || null,
    team_lead_id: parsed.data.team_lead_id || null,
    created_by: user.id,
  };

  const { data, error } = await (supabase as any)
    .from("teams")
    .insert(row)
    .select("id, name, team_lead_id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create team" };
  }

  if (data.team_lead_id) {
    const { error: memberError } = await (supabase as any)
      .from("team_members")
      .upsert(
        {
          team_id: data.id,
          profile_id: data.team_lead_id,
          team_role: "lead",
          added_by: user.id,
        },
        { onConflict: "team_id,profile_id" }
      );

    if (memberError) {
      return { error: memberError.message };
    }
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "team_created",
    metadata: { team_id: data.id, team_name: data.name },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "team",
    entityId: data.id,
    action: "created",
    description: `Created team ${data.name}`,
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function updateTeamAction(values: unknown): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = updateTeamSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid team data" };
  }

  const { id, ...teamValues } = parsed.data;
  const { supabase, user } = ctx.context;
  const patch = {
    ...teamValues,
    slug: slugify(teamValues.name),
    description: teamValues.description || null,
    department: teamValues.department || null,
    team_lead_id: teamValues.team_lead_id || null,
  };

  const { data, error } = await (supabase as any)
    .from("teams")
    .update(patch)
    .eq("id", id)
    .select("id, name, team_lead_id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to update team" };
  }

  if (data.team_lead_id) {
    const { error: memberError } = await (supabase as any)
      .from("team_members")
      .upsert(
        {
          team_id: data.id,
          profile_id: data.team_lead_id,
          team_role: "lead",
          added_by: user.id,
        },
        { onConflict: "team_id,profile_id" }
      );

    if (memberError) {
      return { error: memberError.message };
    }
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "team_updated",
    metadata: { team_id: data.id, team_name: data.name },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "team",
    entityId: data.id,
    action: "updated",
    description: `Updated team ${data.name}`,
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function assignTeamMemberAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = teamMemberSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid team member data",
    };
  }

  const { supabase, user } = ctx.context;
  const { data, error } = await (supabase as any)
    .from("team_members")
    .upsert(
      {
        team_id: parsed.data.team_id,
        profile_id: parsed.data.profile_id,
        team_role: parsed.data.team_role,
        added_by: user.id,
      },
      { onConflict: "team_id,profile_id" }
    )
    .select("id, team_id, profile_id, team_role")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to assign team member" };
  }

  if (data.team_role === "lead") {
    const { error: leadError } = await (supabase as any)
      .from("teams")
      .update({ team_lead_id: data.profile_id })
      .eq("id", data.team_id);

    if (leadError) {
      return { error: leadError.message };
    }
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "team_member_updated",
    metadata: {
      team_member_id: data.id,
      team_id: data.team_id,
      profile_id: data.profile_id,
      team_role: data.team_role,
    },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "team_member",
    entityId: data.id,
    action: "updated",
    description: "Updated team membership",
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function removeTeamMemberAction(
  teamMemberId: string
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const { supabase, user } = ctx.context;
  const { data: member, error: memberError } = await (supabase as any)
    .from("team_members")
    .select("id, team_id, profile_id, team_role")
    .eq("id", teamMemberId)
    .single();

  if (memberError || !member) {
    return { error: memberError?.message ?? "Team member not found" };
  }

  const { error } = await (supabase as any)
    .from("team_members")
    .delete()
    .eq("id", teamMemberId);

  if (error) {
    return { error: error.message };
  }

  if (member.team_role === "lead") {
    await (supabase as any)
      .from("teams")
      .update({ team_lead_id: null })
      .eq("id", member.team_id)
      .eq("team_lead_id", member.profile_id);
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "team_member_updated",
    metadata: {
      team_member_id: member.id,
      team_id: member.team_id,
      profile_id: member.profile_id,
      action: "removed",
    },
  });

  revalidateUserManagementPaths();

  return { success: true, id: member.id };
}

export async function createCrmRoleAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = crmRoleSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid role data" };
  }

  const { supabase, user } = ctx.context;
  const row = {
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
    description: parsed.data.description || null,
    role_type: "custom",
    role_level: parsed.data.role_level,
    parent_role_id: parsed.data.parent_role_id || null,
    icon: parsed.data.icon,
    color: parsed.data.color,
    is_active: parsed.data.is_active,
    is_system: false,
    created_by: user.id,
  };

  const { data, error } = await (supabase as any)
    .from("crm_roles")
    .insert(row)
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create role" };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_created",
    metadata: { role_id: data.id, role_name: data.name },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "crm_role",
    entityId: data.id,
    action: "created",
    description: `Created CRM role ${data.name}`,
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function updateCrmRoleAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = updateCrmRoleSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid role data" };
  }

  const { id, ...roleValues } = parsed.data;
  const { supabase, user } = ctx.context;
  const { data: currentRole, error: roleError } = await (supabase as any)
    .from("crm_roles")
    .select("id, name, slug, is_system")
    .eq("id", id)
    .single();

  if (roleError || !currentRole) {
    return { error: roleError?.message ?? "Role not found" };
  }

  const patch = currentRole.is_system
    ? {
        description: roleValues.description || null,
        icon: roleValues.icon,
        color: roleValues.color,
      }
    : {
        name: roleValues.name,
        slug: slugify(roleValues.name),
        description: roleValues.description || null,
        parent_role_id: roleValues.parent_role_id || null,
        role_level: roleValues.role_level,
        icon: roleValues.icon,
        color: roleValues.color,
        is_active: roleValues.is_active,
      };

  const { data, error } = await (supabase as any)
    .from("crm_roles")
    .update(patch)
    .eq("id", id)
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to update role" };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_updated",
    metadata: {
      role_id: data.id,
      role_name: data.name,
      system_role: currentRole.is_system,
    },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "crm_role",
    entityId: data.id,
    action: "updated",
    description: `Updated CRM role ${data.name}`,
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function deactivateCrmRoleAction(
  roleId: string
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const { supabase, user } = ctx.context;
  const { data: role, error: roleError } = await (supabase as any)
    .from("crm_roles")
    .select("id, name, is_system")
    .eq("id", roleId)
    .single();

  if (roleError || !role) {
    return { error: roleError?.message ?? "Role not found" };
  }

  if (role.is_system) {
    return { error: "System roles cannot be deactivated." };
  }

  const { error } = await (supabase as any)
    .from("crm_roles")
    .update({ is_active: false })
    .eq("id", roleId);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_deactivated",
    metadata: { role_id: role.id, role_name: role.name },
  });

  revalidateUserManagementPaths();

  return { success: true, id: role.id };
}

export async function assignProfileRoleAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = assignProfileRoleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid profile role data",
    };
  }

  const { supabase, user } = ctx.context;

  if (parsed.data.is_primary) {
    const { error: primaryError } = await (supabase as any)
      .from("profile_roles")
      .update({ is_primary: false })
      .eq("profile_id", parsed.data.profile_id);

    if (primaryError) {
      return { error: primaryError.message };
    }
  }

  const { data, error } = await (supabase as any)
    .from("profile_roles")
    .upsert(
      {
        profile_id: parsed.data.profile_id,
        role_id: parsed.data.role_id,
        is_primary: parsed.data.is_primary,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,role_id" }
    )
    .select("id, profile_id, role_id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to assign role" };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_updated",
    metadata: {
      profile_id: data.profile_id,
      role_id: data.role_id,
      profile_role_id: data.id,
    },
  });

  revalidateUserManagementPaths();
  revalidatePath(`/users/${data.profile_id}`);

  return { success: true, id: data.id };
}

export async function updateRolePermissionsAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = updateRolePermissionsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid permission data",
    };
  }

  const { supabase, user } = ctx.context;
  const { data: role, error: roleError } = await (supabase as any)
    .from("crm_roles")
    .select("id, name, slug")
    .eq("id", parsed.data.role_id)
    .single();

  if (roleError || !role) {
    return { error: roleError?.message ?? "Role not found" };
  }

  if (role.slug === "administrator") {
    const loweringAdmin = parsed.data.rules.some(
      (rule) =>
        rule.access_level !== "full_access" ||
        rule.can_admin === false ||
        rule.can_delete === false ||
        rule.can_export === false
    );

    if (loweringAdmin) {
      return { error: "Administrator permissions must remain full access." };
    }
  }

  const rows = parsed.data.rules.map((rule) => ({
    role_id: parsed.data.role_id,
    ...normalizePermissionRule(rule),
  }));

  const { error } = await (supabase as any)
    .from("crm_role_permissions")
    .upsert(rows, { onConflict: "role_id,module_name" });

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_permission_updated",
    metadata: {
      role_id: parsed.data.role_id,
      role_name: role.name,
      rule_count: rows.length,
    },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "crm_role",
    entityId: parsed.data.role_id,
    action: "permissions_updated",
    description: `Updated permissions for ${role.name}`,
  });

  revalidateUserManagementPaths();

  return { success: true, id: parsed.data.role_id };
}

export async function createPermissionSetAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = permissionSetSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid permission set data",
    };
  }

  const { supabase, user } = ctx.context;
  const { rules, ...permissionSetValues } = parsed.data;
  const { data, error } = await (supabase as any)
    .from("crm_permission_sets")
    .insert({
      ...permissionSetValues,
      slug: slugify(permissionSetValues.name),
      description: permissionSetValues.description || null,
      is_system: false,
      created_by: user.id,
    })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create permission set" };
  }

  if (rules.length > 0) {
    const { error: rulesError } = await (supabase as any)
      .from("crm_permission_set_rules")
      .upsert(
        rules.map((rule) => ({
          permission_set_id: data.id,
          ...normalizePermissionRule(rule),
        })),
        { onConflict: "permission_set_id,module_name" }
      );

    if (rulesError) {
      return { error: rulesError.message };
    }
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "permission_set_created",
    metadata: {
      permission_set_id: data.id,
      permission_set_name: data.name,
      rule_count: rules.length,
    },
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function updatePermissionSetAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = updatePermissionSetSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid permission set data",
    };
  }

  const { supabase, user } = ctx.context;
  const { data: currentSet, error: currentError } = await (supabase as any)
    .from("crm_permission_sets")
    .select("id, name, is_system")
    .eq("id", parsed.data.id)
    .single();

  if (currentError || !currentSet) {
    return { error: currentError?.message ?? "Permission set not found" };
  }

  if (currentSet.is_system) {
    return { error: "System permission sets cannot be edited." };
  }

  const { id, rules, ...permissionSetValues } = parsed.data;
  const { data, error } = await (supabase as any)
    .from("crm_permission_sets")
    .update({
      ...permissionSetValues,
      slug: slugify(permissionSetValues.name),
      description: permissionSetValues.description || null,
    })
    .eq("id", id)
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to update permission set" };
  }

  const { error: rulesError } = await (supabase as any)
    .from("crm_permission_set_rules")
    .upsert(
      rules.map((rule) => ({
        permission_set_id: id,
        ...normalizePermissionRule(rule),
      })),
      { onConflict: "permission_set_id,module_name" }
    );

  if (rulesError) {
    return { error: rulesError.message };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "permission_set_updated",
    metadata: {
      permission_set_id: data.id,
      permission_set_name: data.name,
      rule_count: rules.length,
    },
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}

export async function assignPermissionSetToRoleAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = assignPermissionSetToRoleSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid permission assignment",
    };
  }

  const { supabase, user } = ctx.context;
  const { error } = await (supabase as any)
    .from("crm_role_permission_sets")
    .upsert(
      {
        role_id: parsed.data.role_id,
        permission_set_id: parsed.data.permission_set_id,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "role_id,permission_set_id" }
    );

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "role_permission_updated",
    metadata: {
      role_id: parsed.data.role_id,
      permission_set_id: parsed.data.permission_set_id,
      source: "permission_set_assignment",
    },
  });

  revalidateUserManagementPaths();

  return { success: true, id: parsed.data.role_id };
}

export async function inviteMemberAction(
  values: unknown
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = inviteMemberSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid invitation data",
    };
  }

  const { supabase, user } = ctx.context;
  const rawToken = randomBytes(32).toString("base64url");
  const inviteTokenHash = hashInviteToken(rawToken);
  const inviteLink = buildInviteLink(rawToken);

  const { data, error } = await (supabase as any)
    .from("user_invitations")
    .insert({
      email: parsed.data.email.toLowerCase(),
      full_name: parsed.data.full_name,
      department: parsed.data.department || null,
      job_title: parsed.data.job_title || null,
      role_id: parsed.data.role_id || null,
      team_id: parsed.data.team_id || null,
      invite_token_hash: inviteTokenHash,
      delivery_method: parsed.data.delivery_method,
      status: "pending",
      invited_by: user.id,
      expires_at: getInviteExpiry(parsed.data.expires_in_days),
    })
    .select("id, email, full_name, delivery_method")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create invitation" };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "invitation_created",
    metadata: {
      invitation_id: data.id,
      email: data.email,
      delivery_method: data.delivery_method,
    },
  });

  await writeActivityLog({
    supabase,
    actorId: user.id,
    entityType: "user_invitation",
    entityId: data.id,
    action: "created",
    description: `Created invitation for ${data.full_name}`,
  });

  revalidateUserManagementPaths();

  return {
    success: true,
    id: data.id,
    inviteLink:
      parsed.data.delivery_method === "link" ? inviteLink : undefined,
  };
}

export async function revokeInvitationAction(
  invitationId: string
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.context) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const { supabase, user } = ctx.context;
  const { data, error } = await (supabase as any)
    .from("user_invitations")
    .update({ status: "revoked", invite_token_hash: null })
    .eq("id", invitationId)
    .eq("status", "pending")
    .select("id, email")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to revoke invitation" };
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "invitation_updated",
    metadata: {
      invitation_id: data.id,
      email: data.email,
      status: "revoked",
    },
  });

  revalidateUserManagementPaths();

  return { success: true, id: data.id };
}
