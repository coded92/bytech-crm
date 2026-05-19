"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Archive,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Filter,
  KeyRound,
  MailPlus,
  MoreVertical,
  Pencil,
  Plus,
  SlidersHorizontal,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  UserRoundCog,
  UserX,
  UsersRound,
  X,
} from "lucide-react";
import {
  assignPermissionSetToRoleAction,
  createCrmRoleAction,
  createPermissionSetAction,
  createTeamAction,
  inviteMemberAction,
  removeTeamMemberAction,
  updateRolePermissionsAction,
} from "@/lib/actions/team-management";
import { toggleUserActiveAction } from "@/lib/actions/users";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  crmAccessLevels,
  crmModuleNames,
  teamDepartments,
} from "@/lib/validations/team-management";

type ActionState = {
  type: "success" | "error";
  message: string;
} | null;

type ProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "admin" | "staff";
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type RoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role_type: "system" | "custom";
  role_level: number;
  parent_role_id: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
};

type ProfileRoleRow = {
  id: string;
  profile_id: string;
  role_id: string;
  is_primary: boolean;
};

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  department: string | null;
  icon: string;
  color: string;
  team_lead_id: string | null;
  is_active: boolean;
  created_at: string;
};

type TeamMemberRow = {
  id: string;
  team_id: string;
  profile_id: string;
  team_role: "lead" | "member";
  joined_at: string;
};

type PermissionSetRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_system: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};

type PermissionRuleRow = {
  id: string;
  permission_set_id: string;
  module_name: string;
  access_level: string;
};

type RolePermissionRow = {
  id: string;
  role_id: string;
  module_name: string;
  access_level: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  can_admin: boolean;
};

type RolePermissionSetRow = {
  role_id: string;
  permission_set_id: string;
  assigned_by: string | null;
  assigned_at: string | null;
};

type SecurityEventRow = {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type InvitationRow = {
  id: string;
  email: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  role_id: string | null;
  team_id: string | null;
  delivery_method: "email" | "link";
  status: "pending" | "accepted" | "expired" | "revoked";
  invited_at: string;
  expires_at: string;
};

type ActiveSessionRow = {
  user_id: string;
  last_seen_at: string;
  status: string;
};

export type TeamManagementData = {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  teams: TeamRow[];
  teamMembers: TeamMemberRow[];
  permissionSets: PermissionSetRow[];
  permissionSetRules: PermissionRuleRow[];
  rolePermissions: RolePermissionRow[];
  rolePermissionSets: RolePermissionSetRow[];
  permissionActivityEvents: SecurityEventRow[];
  invitations: InvitationRow[];
  activeSessions: ActiveSessionRow[];
};

type TeamTab = "members" | "departments" | "roles" | "permissions";

const teamTabs: Array<{ key: TeamTab; label: string }> = [
  { key: "members", label: "Members" },
  { key: "departments", label: "Teams" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
];

const roleColors = ["#4F46E5", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function TeamManagementPanel({
  data,
  mode,
  activeTab = "members",
  basePath = "/team-management",
  initialInviteOpen = false,
  initialRoleCreateOpen = false,
  initialPermissionSetCreateOpen = false,
}: {
  data: TeamManagementData;
  mode: "team" | "roles";
  activeTab?: TeamTab;
  basePath?: string;
  initialInviteOpen?: boolean;
  initialRoleCreateOpen?: boolean;
  initialPermissionSetCreateOpen?: boolean;
}) {
  const [state, setState] = useState<ActionState>(null);
  const [showInviteModal, setShowInviteModal] = useState(initialInviteOpen);
  const [showRoleCreateModal, setShowRoleCreateModal] = useState(initialRoleCreateOpen);
  const [showPermissionSetCreateModal, setShowPermissionSetCreateModal] = useState(
    initialPermissionSetCreateOpen
  );
  const [isPending, startTransition] = useTransition();
  const safeActiveTab = teamTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : "members";

  useEffect(() => {
    if (initialInviteOpen) setShowInviteModal(true);
  }, [initialInviteOpen]);

  useEffect(() => {
    if (initialRoleCreateOpen) setShowRoleCreateModal(true);
  }, [initialRoleCreateOpen]);

  useEffect(() => {
    if (initialPermissionSetCreateOpen) setShowPermissionSetCreateModal(true);
  }, [initialPermissionSetCreateOpen]);

  const activeProfiles = data.profiles.filter((profile) => profile.is_active);
  const pendingInvites = data.invitations.filter(
    (invite) => invite.status === "pending"
  );
  const systemRoles = data.roles.filter((role) => role.role_type === "system");
  const customRoles = data.roles.filter((role) => role.role_type === "custom");

  const roleUserCount = useMemo(() => {
    const counts = new Map<string, number>();
    data.profileRoles.forEach((role) => {
      counts.set(role.role_id, (counts.get(role.role_id) ?? 0) + 1);
    });
    return counts;
  }, [data.profileRoles]);

  function submitAction(action: () => Promise<{ success: true; inviteLink?: string } | { error: string }>, successMessage: string) {
    setState(null);
    startTransition(async () => {
      const result = await action();

      if ("error" in result) {
        setState({ type: "error", message: result.error });
        return;
      }

      setState({
        type: "success",
        message: result.inviteLink
          ? `${successMessage} Invite link: ${result.inviteLink}`
          : successMessage,
      });
    });
  }

  if (mode === "roles") {
    return (
      <div className="space-y-5">
        <PanelMessage state={state} />
        <RoleHierarchyView
          roles={data.roles}
          roleUserCount={roleUserCount}
          profileCount={data.profiles.length}
        />
        <RoleCreateForm
          roles={data.roles}
          disabled={isPending}
          onSubmit={(formData) =>
            submitAction(
              () => createCrmRoleAction(roleValuesFromForm(formData)),
              "Role created."
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          icon={UsersRound}
          label="Total Members"
          value={String(data.profiles.length)}
          hint="Across all profiles"
          tone="purple"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Active Members"
          value={String(activeProfiles.length)}
          hint="Currently active"
          tone="green"
        />
        <SummaryCard
          icon={Shield}
          label="Teams"
          value={String(getActiveDepartments(data.profiles, data.teams).length)}
          hint="Across organization"
          tone="orange"
        />
        <SummaryCard
          icon={MailPlus}
          label="Pending Invites"
          value={String(pendingInvites.length)}
          hint="Awaiting acceptance"
          tone="blue"
        />
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex min-w-0 gap-6 overflow-x-auto">
          {teamTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`${basePath}?tab=${tab.key}`}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-black transition",
                safeActiveTab === tab.key
                  ? "border-[#4F46E5] text-[#4F46E5]"
                  : "border-transparent text-[#111827] hover:text-[#4F46E5]"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <PanelMessage state={state} />

      {safeActiveTab === "members" ? (
        <MembersTab
          profiles={data.profiles}
          roles={data.roles}
          profileRoles={data.profileRoles}
          teams={data.teams}
          teamMembers={data.teamMembers}
          invitations={pendingInvites}
          activeSessions={data.activeSessions}
          disabled={isPending}
          showInviteModal={showInviteModal}
          onCloseInvite={() => setShowInviteModal(false)}
          onInvite={(formData) =>
            submitAction(
              () => inviteMemberAction(inviteValuesFromForm(formData)),
              "Invitation saved."
            )
          }
          onToggleStatus={(profileId, nextValue) =>
            submitAction(
              () => toggleUserActiveAction(profileId, nextValue),
              nextValue ? "Member activated." : "Member deactivated."
            )
          }
          onRemoveTeamMember={(teamMemberId) =>
            submitAction(
              () => removeTeamMemberAction(teamMemberId),
              "Member removed from team."
            )
          }
        />
      ) : null}

      {safeActiveTab === "departments" ? (
        <DepartmentsTab
          teams={data.teams}
          profiles={data.profiles}
          teamMembers={data.teamMembers}
          disabled={isPending}
          onCreate={(formData) =>
            submitAction(
              () => createTeamAction(teamValuesFromForm(formData)),
              "Team created."
            )
          }
        />
      ) : null}

      {safeActiveTab === "roles" ? (
        <RolesTab
          roles={data.roles}
          roleUserCount={roleUserCount}
          disabled={isPending}
          showCreateModal={showRoleCreateModal}
          onCloseCreate={() => setShowRoleCreateModal(false)}
          onOpenCreate={() => setShowRoleCreateModal(true)}
          onCreate={(formData) =>
            submitAction(
              () => createCrmRoleAction(roleValuesFromForm(formData)),
              "Role created."
            )
          }
        />
      ) : null}

      {safeActiveTab === "permissions" ? (
        <PermissionsTab
          profiles={data.profiles}
          roles={data.roles}
          profileRoles={data.profileRoles}
          permissionSets={data.permissionSets}
          permissionSetRules={data.permissionSetRules}
          rolePermissions={data.rolePermissions}
          rolePermissionSets={data.rolePermissionSets}
          permissionActivityEvents={data.permissionActivityEvents}
          disabled={isPending}
          showCreateModal={showPermissionSetCreateModal}
          onCloseCreate={() => setShowPermissionSetCreateModal(false)}
          onOpenCreate={() => setShowPermissionSetCreateModal(true)}
          onCreateSet={(formData) =>
            submitAction(async () => {
              const assignedRoleIds = formData
                .getAll("assigned_role_ids")
                .map(String)
                .filter(Boolean);
              const result = await createPermissionSetAction(
                permissionSetValuesFromForm(formData, data.permissionSetRules)
              );

              if ("error" in result) return result;

              if (result.id) {
                for (const roleId of assignedRoleIds) {
                  const assignmentResult = await assignPermissionSetToRoleAction({
                    role_id: roleId,
                    permission_set_id: result.id,
                  });

                  if ("error" in assignmentResult) return assignmentResult;
                }
              }

              return { success: true };
            },
              "Permission set created."
            )
          }
          onUpdateRolePermissions={(updates) =>
            submitAction(async () => {
              for (const update of updates) {
                const result = await updateRolePermissionsAction({
                  role_id: update.role_id,
                  rules: [
                    {
                      module_name: update.module_name,
                      access_level: update.access_level,
                    },
                  ],
                });

                if ("error" in result) return result;
              }

              return { success: true };
            }, "Module permissions updated.")
          }
        />
      ) : null}
    </div>
  );
}

function MembersTab({
  profiles,
  roles,
  profileRoles,
  teams,
  teamMembers,
  invitations,
  activeSessions,
  disabled,
  showInviteModal,
  onCloseInvite,
  onInvite,
  onToggleStatus,
  onRemoveTeamMember,
}: {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  teams: TeamRow[];
  teamMembers: TeamMemberRow[];
  invitations: InvitationRow[];
  activeSessions: ActiveSessionRow[];
  disabled: boolean;
  showInviteModal: boolean;
  onCloseInvite: () => void;
  onInvite: (formData: FormData) => void;
  onToggleStatus: (profileId: string, nextValue: boolean) => void;
  onRemoveTeamMember: (teamMemberId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const memberRows = useMemo(() => {
    const latestSessions = new Map<string, string>();
    activeSessions.forEach((session) => {
      if (session.status !== "active") return;

      const existing = latestSessions.get(session.user_id);
      if (
        !existing ||
        new Date(session.last_seen_at).getTime() > new Date(existing).getTime()
      ) {
        latestSessions.set(session.user_id, session.last_seen_at);
      }
    });

    return profiles
      .map((profile) => {
        const primaryRole = profileRoles.find(
          (role) => role.profile_id === profile.id && role.is_primary
        );
        const fallbackRole = profileRoles.find((role) => role.profile_id === profile.id);
        const role = roles.find(
          (item) => item.id === (primaryRole?.role_id ?? fallbackRole?.role_id)
        );
        const memberships = teamMembers.filter(
          (member) => member.profile_id === profile.id
        );
        const assignedTeams = memberships
          .map((member) => teams.find((team) => team.id === member.team_id))
          .filter((team): team is TeamRow => Boolean(team));
        const primaryTeam = assignedTeams[0];
        const searchable = [
          displayName(profile),
          profile.email ?? "",
          role?.name ?? profile.role,
          primaryTeam?.name ?? profile.department ?? "",
        ].join(" ").toLowerCase();

        return {
          profile,
          role,
          memberships,
          primaryTeam,
          lastSeenAt: latestSessions.get(profile.id) ?? null,
          searchable,
        };
      })
      .filter((row) => {
        const matchesSearch = row.searchable.includes(search.trim().toLowerCase());
        const matchesTeam =
          teamFilter === "all" ||
          row.memberships.some((member) => member.team_id === teamFilter) ||
          row.profile.department === teamFilter;
        const matchesRole =
          roleFilter === "all" ||
          row.role?.id === roleFilter ||
          row.profile.role === roleFilter;

        return matchesSearch && matchesTeam && matchesRole;
      });
  }, [
    activeSessions,
    profileRoles,
    profiles,
    roles,
    search,
    teamFilter,
    teamMembers,
    teams,
    roleFilter,
  ]);

  const visibleRows = memberRows.slice(0, 8);
  const teamSummary = getTeamSummary(profiles, teams, teamMembers);
  const popularRoles = getPopularRoles(roles, profileRoles, profiles);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
        <section className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[292px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#617099]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members..."
                className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-[13px] font-semibold shadow-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
                {teamDepartments.map((department) => (
                  <option key={department} value={department}>{formatLabel(department)}</option>
                ))}
              </select>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 px-4 text-[13px] font-black text-[#4F46E5]"
              >
                <Filter className="size-4" />
                Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                  <th className="w-[30%] px-1 py-4">Member</th>
                  <th className="w-[14%] px-3 py-4">Role</th>
                  <th className="w-[15%] px-3 py-4">Team</th>
                  <th className="w-[13%] px-3 py-4">Status</th>
                  <th className="w-[18%] px-3 py-4">Last Active</th>
                  <th className="w-[10%] px-3 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ profile, role, memberships, primaryTeam, lastSeenAt }) => (
                  <tr
                    key={profile.id}
                    className="border-b border-slate-100 text-[#17213F] transition hover:bg-[#F8F7FF]"
                  >
                    <td className="px-1 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar profile={profile} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-black text-[#111827]">
                              {displayName(profile)}
                            </p>
                            {profile.role === "admin" ? (
                              <span className="rounded-md bg-[#F1ECFF] px-1.5 py-0.5 text-[10px] font-black text-[#4F46E5]">
                                You
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-[12px] font-medium text-[#526187]">
                            {profile.email ?? "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge compact>{role?.name ?? formatLabel(profile.role)}</StatusBadge>
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#26345D]">
                      {primaryTeam?.name ?? formatLabel(profile.department ?? "unassigned")}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge tone={profile.is_active ? "success" : "danger"} compact>
                        <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
                        {profile.is_active ? "Active" : "Inactive"}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-3 text-[13px] font-semibold text-[#26345D]">
                      {lastSeenAt ? formatRelativeActivity(lastSeenAt) : "No session"}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <MemberActionMenu
                        profile={profile}
                        teamMemberId={memberships[0]?.id ?? null}
                        disabled={disabled}
                        onToggleStatus={onToggleStatus}
                        onRemoveTeamMember={onRemoveTeamMember}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRows.length === 0 ? (
              <div className="border-b border-slate-100 py-10 text-center text-sm font-bold text-slate-500">
                No members match the current filters.
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {visibleRows.length > 0 ? 1 : 0} to {visibleRows.length} of {profiles.length} members</p>
            <div className="flex items-center gap-2">
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
                <ChevronRight className="size-4 rotate-180" />
              </button>
              <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-[#26345D]">2</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-[#26345D]">3</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <TeamSummaryCard items={teamSummary} />
          <PopularRolesCard items={popularRoles} />
          <PendingInvitesCard invitations={invitations} />
        </aside>
      </div>

      {showInviteModal ? (
        <InviteMemberModal
          roles={roles}
          teams={teams}
          disabled={disabled}
          onClose={onCloseInvite}
          onInvite={onInvite}
        />
      ) : null}
    </>
  );
}

function MemberActionMenu({
  profile,
  teamMemberId,
  disabled,
  onToggleStatus,
  onRemoveTeamMember,
}: {
  profile: ProfileRow;
  teamMemberId: string | null;
  disabled: boolean;
  onToggleStatus: (profileId: string, nextValue: boolean) => void;
  onRemoveTeamMember: (teamMemberId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open actions for ${displayName(profile)}`}
          className="inline-flex size-8 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-xl border border-slate-100 bg-white p-2 text-[#111827] shadow-xl shadow-slate-200/70"
      >
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href={`/users/${profile.id}`}>
            <UserRound className="size-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href={`/users/${profile.id}/edit`}>
            <Pencil className="size-4" />
            Edit Member
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/team-management?tab=roles">
            <UserRoundCog className="size-4" />
            Change Role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/team-management?tab=departments">
            <UsersRound className="size-4" />
            Change Team
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem
          disabled={disabled}
          className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
          onSelect={(event) => {
            event.preventDefault();
            onToggleStatus(profile.id, !profile.is_active);
          }}
        >
          <UserX className="size-4" />
          {profile.is_active ? "Deactivate Member" : "Activate Member"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled || !teamMemberId}
          className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
          onSelect={(event) => {
            event.preventDefault();
            if (teamMemberId) onRemoveTeamMember(teamMemberId);
          }}
        >
          <Trash2 className="size-4" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TeamSummaryCard({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <RailCard title="Team Summary">
      <div className="flex items-center gap-5">
        <DonutChart items={items} />
        <div className="min-w-0 flex-1 space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#26345D]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-[#111827]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/reports">
          <Crown className="size-4" />
          View Team Reports
        </Link>
      </Button>
    </RailCard>
  );
}

function PopularRolesCard({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <RailCard title="Popular Roles">
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-[12px] font-bold text-[#26345D]"
          >
            <span>{item.label}</span>
            <span className="text-[#111827]">{item.value}</span>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-[12px] font-semibold text-[#617099]">No role data yet.</p>
        ) : null}
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/team-management?tab=roles">
          <UserRoundCog className="size-4" />
          Manage Roles
        </Link>
      </Button>
    </RailCard>
  );
}

function PendingInvitesCard({ invitations }: { invitations: InvitationRow[] }) {
  return (
    <RailCard
      title="Pending Invites"
      action={
        <Link
          href="/team-management?tab=members&invite=true"
          className="text-[12px] font-black text-[#4F46E5]"
        >
          View All
        </Link>
      }
    >
      <div className="space-y-3">
        {invitations.slice(0, 2).map((invite, index) => (
          <div key={invite.id} className="flex items-start gap-3">
            <span
              className="mt-1 size-2.5 rounded-full"
              style={{ backgroundColor: index === 0 ? "#14B8A6" : "#0F4C9A" }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-black text-[#111827]">
                {invite.email}
              </p>
              <p className="text-[11px] font-semibold text-[#617099]">
                {invite.job_title || formatLabel(invite.department ?? "Pending role")}
              </p>
            </div>
            <p className="whitespace-nowrap text-[11px] font-semibold text-[#617099]">
              {formatRelativeActivity(invite.invited_at)}
            </p>
          </div>
        ))}
        {invitations.length === 0 ? (
          <p className="text-[12px] font-semibold text-[#617099]">
            No pending invites.
          </p>
        ) : null}
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/team-management?tab=members&invite=true">
          <UsersRound className="size-4" />
          Manage Invites
        </Link>
      </Button>
    </RailCard>
  );
}

function RailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-black text-[#111827]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function DonutChart({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments =
    total > 0
      ? items.map((item) => {
          const start = cursor;
          const size = (item.value / total) * 100;
          cursor += size;
          return `${item.color} ${start}% ${cursor}%`;
        })
      : ["#E5E7EB 0% 100%"];

  return (
    <div
      className="size-28 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${segments.join(", ") || "#E5E7EB 0% 100%"})`,
      }}
    >
      <div className="flex size-full items-center justify-center rounded-full">
        <span className="size-14 rounded-full bg-white" />
      </div>
    </div>
  );
}

function InviteMemberModal({
  roles,
  teams,
  disabled,
  onClose,
  onInvite,
}: {
  roles: RoleRow[];
  teams: TeamRow[];
  disabled: boolean;
  onClose: () => void;
  onInvite: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 px-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#111827]">Invite Member</h2>
            <p className="mt-1 text-sm font-medium text-[#526187]">
              Add a real pending invitation to BYTECH CRM.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-[#26345D] hover:bg-slate-100"
            aria-label="Close invite member modal"
          >
            x
          </button>
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onInvite(new FormData(event.currentTarget));
            event.currentTarget.reset();
            onClose();
          }}
        >
          <Input name="full_name" placeholder="Full name" required className="h-11 rounded-xl" />
          <Input name="email" type="email" placeholder="Email address" required className="h-11 rounded-xl" />
          <select name="department" className={selectClassName} defaultValue="">
            <option value="">Select department</option>
            {teamDepartments.map((department) => (
              <option key={department} value={department}>
                {formatLabel(department)}
              </option>
            ))}
          </select>
          <Input name="job_title" placeholder="Job title optional" className="h-11 rounded-xl" />
          <select name="role_id" className={selectClassName} defaultValue="">
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select name="team_id" className={selectClassName} defaultValue="">
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select name="delivery_method" className={selectClassName} defaultValue="email">
            <option value="email">Email record</option>
            <option value="link">Generate invite link</option>
          </select>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={disabled} className="h-10 rounded-xl bg-[#4F46E5] px-5 font-black hover:bg-[#4338CA]">
              <MailPlus className="size-4" />
              Send Invitation
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DepartmentsTab({
  teams,
  profiles,
  teamMembers,
  disabled,
  onCreate,
}: {
  teams: TeamRow[];
  profiles: ProfileRow[];
  teamMembers: TeamMemberRow[];
  disabled: boolean;
  onCreate: (formData: FormData) => void;
}) {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const teamSummary = getTeamSummary(profiles, teams, teamMembers);

  const teamRows = useMemo(() => {
    return teams
      .map((team) => {
        const members = teamMembers.filter((member) => member.team_id === team.id);
        const leadMember = members.find((member) => member.team_role === "lead");
        const lead =
          profiles.find((profile) => profile.id === team.team_lead_id) ??
          profiles.find((profile) => profile.id === leadMember?.profile_id) ??
          null;
        const searchable = [
          team.name,
          team.description ?? "",
          lead ? displayName(lead) : "",
          team.department ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return { team, members, lead, searchable };
      })
      .filter((row) => row.searchable.includes(search.trim().toLowerCase()));
  }, [profiles, search, teamMembers, teams]);

  const visibleRows = teamRows.slice(0, 6);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
        <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[16px] font-black text-[#111827]">
                Teams ({teams.length})
              </h2>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-[#526187]">
                Organize your members into teams to streamline collaboration.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="relative w-[270px] max-w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#617099]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search teams..."
                  className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-[13px] font-semibold shadow-none"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 px-4 text-[13px] font-black text-[#4F46E5]"
              >
                <Filter className="size-4" />
                Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                  <th className="w-[22%] px-5 py-4">Team</th>
                  <th className="w-[28%] px-3 py-4">Description</th>
                  <th className="w-[12%] px-3 py-4">Members</th>
                  <th className="w-[20%] px-3 py-4">Team Lead</th>
                  <th className="w-[12%] px-3 py-4">Created On</th>
                  <th className="w-[6%] px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ team, members, lead }, index) => (
                  <tr
                    key={team.id}
                    className="border-b border-slate-100 text-[#17213F] transition hover:bg-[#F8F7FF]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <IconBox
                          color={team.color || teamTone(index).color}
                          icon={teamIcon(index)}
                        />
                        <p className="truncate text-[13px] font-black text-[#111827]">
                          {team.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="max-w-[220px] text-[13px] font-semibold leading-6 text-[#26345D]">
                        {team.description || "No description yet."}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#26345D]">
                        <UsersRound className="size-4" />
                        {members.length}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {lead ? (
                        <div className="flex items-center gap-3">
                          <Avatar profile={lead} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-black text-[#111827]">
                              {displayName(lead)}
                            </p>
                            <p className="truncate text-[12px] font-semibold text-[#526187]">
                              {lead.job_title || formatLabel(lead.role)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[13px] font-semibold text-[#617099]">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                      {formatShortDate(team.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <TeamActionMenu team={team} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRows.length === 0 ? (
              <div className="border-b border-slate-100 py-10 text-center text-sm font-bold text-slate-500">
                No teams match the current search.
              </div>
            ) : null}
          </div>

          <div className="px-5 py-4 text-[13px] font-semibold text-[#26345D]">
            Showing {visibleRows.length > 0 ? 1 : 0} to {visibleRows.length} of{" "}
            {teamRows.length} teams
          </div>
        </section>

        <aside className="space-y-4">
          <TeamSummaryCard items={teamSummary} />
          <PopularTeamActionsCard onAddTeam={() => setShowCreateModal(true)} />
          <NeedHelpCard />
        </aside>
      </div>

      {showCreateModal ? (
        <CreateTeamModal
          profiles={profiles}
          disabled={disabled}
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreate}
        />
      ) : null}
    </>
  );
}

function PopularTeamActionsCard({ onAddTeam }: { onAddTeam: () => void }) {
  const actions = [
    {
      icon: Plus,
      title: "Add New Team",
      description: "Create a new team",
      onClick: onAddTeam,
    },
    {
      icon: UserRoundCog,
      title: "Assign Team Lead",
      description: "Change team leadership",
      href: "/settings/team-management",
    },
    {
      icon: UsersRound,
      title: "View All Members",
      description: "See members by team",
      href: "/team-management?tab=members",
    },
    {
      icon: Settings,
      title: "Manage Team Roles",
      description: "Set roles for team members",
      href: "/team-management?tab=roles",
    },
  ];

  return (
    <RailCard title="Popular Actions">
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-black text-[#111827]">
                  {action.title}
                </span>
                <span className="block text-[12px] font-semibold text-[#617099]">
                  {action.description}
                </span>
              </span>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#F8F7FF]"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-[#F8F7FF]"
            >
              {content}
            </button>
          );
        })}
      </div>
    </RailCard>
  );
}

function NeedHelpCard() {
  return (
    <section className="rounded-[1.25rem] border border-[#E6E0FF] bg-[#F8F7FF] p-5 shadow-sm shadow-slate-100/80">
      <h3 className="text-[15px] font-black text-[#111827]">Need Help?</h3>
      <p className="mt-3 text-[13px] font-semibold leading-6 text-[#526187]">
        Learn more about team management and best practices.
      </p>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/support">
          <ShieldCheck className="size-4" />
          View Help Center
        </Link>
      </Button>
    </section>
  );
}

function TeamActionMenu({ team }: { team: TeamRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open actions for ${team.name}`}
          className="inline-flex size-8 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border border-slate-100 bg-white p-2 text-[#111827] shadow-xl shadow-slate-200/70"
      >
        <DropdownMenuItem disabled className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Boxes className="size-4" />
          View Team Details
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/settings/team-management">
            <Pencil className="size-4" />
            Edit Team
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/team-management?tab=members">
            <UsersRound className="size-4" />
            Manage Members
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/settings/team-management">
            <UserRoundCog className="size-4" />
            Change Team Lead
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/settings/team-management">
            <Settings className="size-4" />
            Team Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem disabled className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold text-red-600">
          <Archive className="size-4" />
          Archive Team
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold text-red-600">
          <Trash2 className="size-4" />
          Delete Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateTeamModal({
  profiles,
  disabled,
  onClose,
  onCreate,
}: {
  profiles: ProfileRow[];
  disabled: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 px-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#111827]">Add New Team</h2>
            <p className="mt-1 text-sm font-medium text-[#526187]">
              Create a real team record for member organization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-[#26345D] hover:bg-slate-100"
            aria-label="Close add team modal"
          >
            x
          </button>
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(new FormData(event.currentTarget));
            event.currentTarget.reset();
            onClose();
          }}
        >
          <Input name="name" placeholder="Team name" required className="h-11 rounded-xl" />
          <select name="department" className={selectClassName} defaultValue="">
            <option value="">Select department</option>
            {teamDepartments.map((department) => (
              <option key={department} value={department}>
                {formatLabel(department)}
              </option>
            ))}
          </select>
          <Input
            name="description"
            placeholder="Description optional"
            className="h-11 rounded-xl sm:col-span-2"
          />
          <select name="team_lead_id" className={selectClassName} defaultValue="">
            <option value="">Team lead optional</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {displayName(profile)}
              </option>
            ))}
          </select>
          <select name="color" className={selectClassName} defaultValue="#4F46E5">
            {roleColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={disabled} className="h-10 rounded-xl bg-[#4F46E5] px-5 font-black hover:bg-[#4338CA]">
              <UserPlus className="size-4" />
              Create Team
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RolesTab({
  roles,
  roleUserCount,
  disabled,
  showCreateModal,
  onCloseCreate,
  onOpenCreate,
  onCreate,
}: {
  roles: RoleRow[];
  roleUserCount: Map<string, number>;
  disabled: boolean;
  showCreateModal: boolean;
  onCloseCreate: () => void;
  onOpenCreate: () => void;
  onCreate: (formData: FormData) => void;
}) {
  const [search, setSearch] = useState("");
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const haystack = [role.name, role.description ?? "", role.role_type]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    });
  }, [roles, search]);
  const visibleRoles = filteredRoles.slice(0, 7);
  const customRoles = roles.filter((role) => role.role_type === "custom");
  const systemRoles = roles.filter((role) => role.role_type === "system");
  const rolesWithUsers = roles.filter((role) => (roleUserCount.get(role.id) ?? 0) > 0);
  const overviewItems = buildRoleOverviewItems(roles, roleUserCount);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          icon={ShieldCheck}
          label="Total Roles"
          value={String(roles.length)}
          hint="Across organization"
          tone="purple"
        />
        <SummaryCard
          icon={UsersRound}
          label="Custom Roles"
          value={String(customRoles.length)}
          hint="Created by you"
          tone="green"
        />
        <SummaryCard
          icon={UserRoundCog}
          label="System Roles"
          value={String(systemRoles.length)}
          hint="Default roles"
          tone="orange"
        />
        <SummaryCard
          icon={Shield}
          label="Roles with Users"
          value={String(rolesWithUsers.length)}
          hint="Assigned to users"
          tone="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
        <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-[292px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#617099]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles..."
                className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-[13px] font-semibold shadow-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none"
                defaultValue="all"
              >
                <option value="all">All Teams</option>
              </select>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 px-4 text-[13px] font-black text-[#4F46E5]"
              >
                <Filter className="size-4" />
                Filters
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                  <th className="w-[22%] px-5 py-4">Role Name</th>
                  <th className="w-[26%] px-3 py-4">Description</th>
                  <th className="w-[15%] px-3 py-4">Team Access</th>
                  <th className="w-[10%] px-3 py-4">Users</th>
                  <th className="w-[16%] px-3 py-4">Created On</th>
                  <th className="w-[11%] px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRoles.map((role, index) => {
                  const userCount = roleUserCount.get(role.id) ?? 0;
                  return (
                    <tr
                      key={role.id}
                      className="border-b border-slate-100 text-[#17213F] transition hover:bg-[#F8F7FF]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <IconBox
                            color={role.color || teamTone(index).color}
                            icon={roleIcon(index)}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[13px] font-black text-[#111827]">
                                {role.name}
                              </p>
                              {role.is_system ? (
                                <StatusBadge compact>System</StatusBadge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <p className="max-w-[220px] text-[13px] font-semibold leading-6 text-[#26345D]">
                          {role.description || "No description yet."}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge compact>
                          {role.role_type === "system" ? "All Teams" : "Custom Access"}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#26345D]">
                          <UsersRound className="size-4" />
                          {userCount}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                        {formatShortDate(role.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <RoleActionMenu role={role} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleRoles.length === 0 ? (
              <div className="border-b border-slate-100 py-10 text-center text-sm font-bold text-slate-500">
                No roles match the current search.
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {visibleRoles.length > 0 ? 1 : 0} to {visibleRoles.length} of{" "}
              {filteredRoles.length} roles
            </p>
            <div className="flex items-center gap-2">
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
                <ChevronRight className="size-4 rotate-180" />
              </button>
              <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-sm font-black text-[#26345D]">2</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <RoleOverviewCard items={overviewItems} />
          <PopularRoleActionsCard onCreateRole={onOpenCreate} />
          <NeedHelpCard />
        </aside>
      </div>

      {showCreateModal ? (
        <CreateRoleModal
          roles={roles}
          disabled={disabled}
          onClose={onCloseCreate}
          onCreate={onCreate}
        />
      ) : null}
    </>
  );
}

function RoleOverviewCard({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <RailCard title="Role Overview">
      <div className="flex items-center gap-5">
        <DonutChart items={items} />
        <div className="min-w-0 flex-1 space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#26345D]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-[#111827]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/reports">
          <Crown className="size-4" />
          View Role Reports
        </Link>
      </Button>
    </RailCard>
  );
}

function PopularRoleActionsCard({ onCreateRole }: { onCreateRole: () => void }) {
  const actions = [
    {
      icon: Plus,
      title: "Create Role",
      description: "Add a new custom role",
      onClick: onCreateRole,
    },
    {
      icon: Copy,
      title: "Duplicate Role",
      description: "Copy permissions from existing role",
      disabled: true,
    },
    {
      icon: Pencil,
      title: "Edit Permissions",
      description: "Update role permissions",
      href: "/team-management?tab=permissions",
    },
    {
      icon: Trash2,
      title: "Delete Role",
      description: "Remove a role",
      disabled: true,
      danger: true,
    },
  ];

  return (
    <RailCard title="Popular Actions">
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  action.danger
                    ? "bg-red-50 text-red-600"
                    : "bg-[#F1ECFF] text-[#4F46E5]"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[13px] font-black",
                    action.danger ? "text-red-600" : "text-[#111827]"
                  )}
                >
                  {action.title}
                </span>
                <span className="block text-[12px] font-semibold text-[#617099]">
                  {action.description}
                </span>
              </span>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#F8F7FF]"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.title}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-[#F8F7FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {content}
            </button>
          );
        })}
      </div>
    </RailCard>
  );
}

function RoleActionMenu({ role }: { role: RoleRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Open actions for ${role.name}`}
          className="inline-flex size-8 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-xl border border-slate-100 bg-white p-2 text-[#111827] shadow-xl shadow-slate-200/70"
      >
        <DropdownMenuItem disabled className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Eye className="size-4" />
          View Role Details
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/settings/roles">
            <Pencil className="size-4" />
            Edit Role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Copy className="size-4" />
          Duplicate Role
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold">
          <Link href="/team-management?tab=permissions">
            <Shield className="size-4" />
            Manage Permissions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem
          disabled
          className="h-9 gap-3 rounded-lg px-3 text-[13px] font-bold text-red-600"
        >
          <Trash2 className="size-4" />
          Delete Role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateRoleModal({
  roles,
  disabled,
  onClose,
  onCreate,
}: {
  roles: RoleRow[];
  disabled: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 px-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/20">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#111827]">Create Role</h2>
            <p className="mt-1 text-sm font-medium text-[#526187]">
              Add a real custom role for permissions and team access.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-[#26345D] hover:bg-slate-100"
            aria-label="Close create role modal"
          >
            x
          </button>
        </div>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(new FormData(event.currentTarget));
            event.currentTarget.reset();
            onClose();
          }}
        >
          <Input name="name" placeholder="Role name" required className="h-11 rounded-xl" />
          <Input name="description" placeholder="Description optional" className="h-11 rounded-xl" />
          <select name="parent_role_id" className={selectClassName} defaultValue="">
            <option value="">Reports to optional</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select name="color" className={selectClassName} defaultValue="#4F46E5">
            {roleColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          <Input
            name="role_level"
            type="number"
            defaultValue="50"
            min={0}
            max={1000}
            className="h-11 rounded-xl"
          />
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={disabled} className="h-10 rounded-xl bg-[#4F46E5] px-5 font-black hover:bg-[#4338CA]">
              <Plus className="size-4" />
              Create Role
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PermissionsTab({
  profiles,
  roles,
  profileRoles,
  permissionSets,
  permissionSetRules,
  rolePermissions,
  rolePermissionSets,
  permissionActivityEvents,
  disabled,
  showCreateModal,
  onCloseCreate,
  onOpenCreate,
  onCreateSet,
  onUpdateRolePermissions,
}: {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  permissionSets: PermissionSetRow[];
  permissionSetRules: PermissionRuleRow[];
  rolePermissions: RolePermissionRow[];
  rolePermissionSets: RolePermissionSetRow[];
  permissionActivityEvents: SecurityEventRow[];
  disabled: boolean;
  showCreateModal: boolean;
  onCloseCreate: () => void;
  onOpenCreate: () => void;
  onCreateSet: (formData: FormData) => void;
  onUpdateRolePermissions: (
    updates: Array<{
      role_id: string;
      module_name: (typeof crmModuleNames)[number];
      access_level: (typeof crmAccessLevels)[number];
    }>
  ) => void;
}) {
  const [selectedModule, setSelectedModule] = useState<(typeof crmModuleNames)[number] | null>(
    null
  );
  const [permissionModalModule, setPermissionModalModule] = useState<
    (typeof crmModuleNames)[number] | null
  >(null);
  const [showManageSets, setShowManageSets] = useState(false);
  const customPermissionSets = permissionSets.filter((set) => !set.is_system);
  const visibleRoles = roles.slice(0, 5);
  const permissionRows = crmModuleNames.slice(0, 10);
  const permissionSummary = buildPermissionSummary(
    permissionRows,
    visibleRoles,
    rolePermissions
  );
  const totalPermissions = permissionSummary.reduce((sum, item) => sum + item.value, 0);

  if (showManageSets) {
    return (
      <>
        <ManagePermissionSetsPanel
          profiles={profiles}
          roles={roles}
          profileRoles={profileRoles}
          permissionSets={customPermissionSets}
          permissionSetRules={permissionSetRules}
          rolePermissionSets={rolePermissionSets}
          permissionActivityEvents={permissionActivityEvents}
          onBack={() => setShowManageSets(false)}
          onCreateSet={onOpenCreate}
        />

        {showCreateModal ? (
          <CreatePermissionSetModal
            roles={roles}
            permissionSets={permissionSets}
            permissionSetRules={permissionSetRules}
            disabled={disabled}
            onClose={onCloseCreate}
            onCreate={onCreateSet}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
        <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
              <h2 className="text-[17px] font-black text-[#111827]">Permission Sets</h2>
              <p className="mt-1 text-[13px] font-semibold text-[#34406B]">
                Define what actions can be performed across BYTECH CRM.
            </p>
          </div>
            <div className="flex flex-wrap gap-2">
              <select className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none">
                <option>All Roles</option>
              </select>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-slate-200 px-4 text-[13px] font-black text-[#4F46E5]"
              >
                <Filter className="size-4" />
                Filter
              </Button>
              <Button
                type="button"
                disabled={!selectedModule}
                onClick={() => {
                  if (selectedModule) setPermissionModalModule(selectedModule);
                }}
                className="h-10 rounded-xl bg-[#4F46E5] px-4 text-[13px] font-black shadow-md shadow-indigo-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SlidersHorizontal className="size-4" />
                Set Permission
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                  <th className="w-[26%] px-5 py-4">Permission Module</th>
                  {visibleRoles.map((role) => (
                    <th key={role.id} className="px-3 py-4">
                      {role.name}
                    </th>
                  ))}
                  <th className="w-[11%] px-4 py-4 text-center">Custom Roles</th>
                  <th className="w-[6%] px-3 py-4" />
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((moduleName, index) => {
                  const metadata = permissionModuleMeta(moduleName, index);
                  const customRoleCount = customRolesWithPermission(
                    roles,
                    rolePermissions,
                    moduleName
                  );

                  return (
                    <tr
                      key={moduleName}
                      onClick={() => setSelectedModule(moduleName)}
                      className={cn(
                        "cursor-pointer border-b border-slate-100 text-[#17213F] transition hover:bg-[#F8F7FF]",
                        selectedModule === moduleName && "bg-[#F8F7FF] ring-1 ring-inset ring-[#4F46E5]/20"
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <IconBox icon={metadata.icon} color={metadata.color} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-black text-[#111827]">
                              {metadata.label}
                            </p>
                            <p className="mt-0.5 max-w-[240px] text-[12px] font-semibold text-[#526187]">
                              {metadata.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      {visibleRoles.map((role) => {
                        const access = permissionAccessForRole(
                          role,
                          moduleName,
                          rolePermissions
                        );
                        return (
                          <td key={role.id} className="px-3 py-4">
                            <PermissionAccessLabel access={access} />
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-center text-[13px] font-black text-[#26345D]">
                        {customRoleCount}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedModule(moduleName);
                          }}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-xl transition",
                            selectedModule === moduleName
                              ? "bg-[#4F46E5] text-white"
                              : "text-[#26345D] hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
                          )}
                          aria-label={`Select ${metadata.label}`}
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing 1 to {permissionRows.length} of {permissionRows.length} modules</p>
            <div className="flex items-center gap-2">
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
                <ChevronRight className="size-4 rotate-180" />
              </button>
              <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
              <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <PermissionSummaryCard items={permissionSummary} total={totalPermissions} />
          <CustomPermissionSetsCard
            permissionSets={customPermissionSets}
            permissionSetRules={permissionSetRules}
            onManageSets={() => setShowManageSets(true)}
          />
          <PopularPermissionActionsCard onCreateSet={onOpenCreate} />
          <NeedHelpCard />
        </aside>
      </div>

      {permissionModalModule ? (
        <SetPermissionsModal
          moduleName={permissionModalModule}
          roles={roles}
          rolePermissions={rolePermissions}
          disabled={disabled}
          onClose={() => setPermissionModalModule(null)}
          onSave={(updates) => {
            onUpdateRolePermissions(updates);
            setPermissionModalModule(null);
          }}
        />
      ) : null}

      {showCreateModal ? (
        <CreatePermissionSetModal
          roles={roles}
          permissionSets={permissionSets}
          permissionSetRules={permissionSetRules}
          disabled={disabled}
          onClose={onCloseCreate}
          onCreate={onCreateSet}
        />
      ) : null}
    </>
  );
}

function PermissionSummaryCard({
  items,
  total,
}: {
  items: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <RailCard title="Permission Summary">
      <div className="flex items-center gap-5">
        <DonutChart items={items} />
        <div className="min-w-0 flex-1 space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#26345D]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-[#111827]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[13px] font-semibold text-[#526187]">Total Permissions</p>
        <p className="mt-1 text-2xl font-black text-[#111827]">{total}</p>
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Link href="/reports">
          <Crown className="size-4" />
          View Full Report
        </Link>
      </Button>
    </RailCard>
  );
}

function CustomPermissionSetsCard({
  permissionSets,
  permissionSetRules,
  onManageSets,
}: {
  permissionSets: PermissionSetRow[];
  permissionSetRules: PermissionRuleRow[];
  onManageSets: () => void;
}) {
  return (
    <RailCard title="Custom Permission Sets">
      <div className="space-y-3">
        {permissionSets.slice(0, 3).map((set, index) => {
          const ruleCount = permissionSetRules.filter(
            (rule) => rule.permission_set_id === set.id
          ).length;
          const tone = teamTone(index);

          return (
            <div key={set.id} className="flex items-center gap-3 rounded-xl p-1.5">
              <IconBox icon={UsersRound} color={set.color || tone.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black text-[#111827]">
                  {set.name}
                </p>
                <p className="text-[12px] font-semibold text-[#617099]">
                  {ruleCount} permissions
                </p>
              </div>
              <ChevronRight className="size-4 text-[#26345D]" />
            </div>
          );
        })}
        {permissionSets.length === 0 ? (
          <p className="text-[12px] font-semibold text-[#617099]">
            No custom permission sets yet.
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        onClick={onManageSets}
        variant="outline"
        className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
      >
        <Settings className="size-4" />
        Manage Permission Sets
      </Button>
    </RailCard>
  );
}

function ManagePermissionSetsPanel({
  profiles,
  roles,
  profileRoles,
  permissionSets,
  permissionSetRules,
  rolePermissionSets,
  permissionActivityEvents,
  onBack,
  onCreateSet,
}: {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  permissionSets: PermissionSetRow[];
  permissionSetRules: PermissionRuleRow[];
  rolePermissionSets: RolePermissionSetRow[];
  permissionActivityEvents: SecurityEventRow[];
  onBack: () => void;
  onCreateSet: () => void;
}) {
  const [detailSetId, setDetailSetId] = useState<string | null>(null);
  const detailSet = detailSetId
    ? permissionSets.find((set) => set.id === detailSetId) ?? null
    : null;
  const activeCount = permissionSets.filter((set) => set.is_active).length;
  const inactiveCount = permissionSets.length - activeCount;
  const rolesUsingCount = rolePermissionSets.filter((assignment) =>
    permissionSets.some((set) => set.id === assignment.permission_set_id)
  ).length;
  const summary = [
    { label: "Active", value: activeCount, color: "#10B981" },
    { label: "Inactive", value: inactiveCount, color: "#E11D48" },
    { label: "Roles Using", value: rolesUsingCount, color: "#F59E0B" },
    { label: "Total Permission Sets", value: permissionSets.length, color: "#1D8BFF" },
  ];

  if (detailSet) {
    return (
      <PermissionSetDetailView
        profiles={profiles}
        roles={roles}
        profileRoles={profileRoles}
        permissionSet={detailSet}
        permissionSetRules={permissionSetRules}
        rolePermissionSets={rolePermissionSets}
        permissionActivityEvents={permissionActivityEvents}
        onBack={() => setDetailSetId(null)}
        onBackToMatrix={onBack}
        onCreateSet={onCreateSet}
      />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
      <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-2 text-[12px] font-black text-[#4F46E5] hover:underline"
            >
              Back to Permission Matrix
            </button>
            <h2 className="text-[17px] font-black text-[#111827]">
              Manage Permission Sets
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#34406B]">
              View, edit, and manage custom permission sets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none">
              <option>All Roles</option>
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 px-4 text-[13px] font-black text-[#4F46E5]"
            >
              <Filter className="size-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C89A8]" />
            <input
              type="search"
              placeholder="Search permission sets..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
            />
          </div>
          <Button
            type="button"
            onClick={onCreateSet}
            variant="outline"
            className="h-10 rounded-xl border-[#B9A8FF] px-4 text-[13px] font-black text-[#4F46E5]"
          >
            <Plus className="size-4" />
            Create Permission Set
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                <th className="w-[27%] px-5 py-4">Permission Set</th>
                <th className="w-[25%] px-3 py-4">Description</th>
                <th className="px-3 py-4">Roles Using</th>
                <th className="px-3 py-4">Created On</th>
                <th className="px-3 py-4">Status</th>
                <th className="w-[8%] px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissionSets.map((set, index) => {
                const metadata = permissionSetVisual(index, set.color);
                const rolesUsing = rolePermissionSets.filter(
                  (assignment) => assignment.permission_set_id === set.id
                ).length;

                return (
                  <tr key={set.id} className="border-b border-slate-100 text-[#17213F]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <IconBox
                          icon={metadata.icon}
                          color={metadata.color}
                          className="size-9 rounded-lg"
                        />
                        <p className="text-[13px] font-black text-[#111827]">
                          {set.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="max-w-[230px] text-[13px] font-semibold leading-6 text-[#26345D]">
                        {set.description || "Reusable permission access for selected modules."}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#26345D]">
                        <UsersRound className="size-4" />
                        {rolesUsing} {rolesUsing === 1 ? "Role" : "Roles"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                      {formatShortDate(set.created_at)}
                    </td>
                    <td className="px-3 py-4">
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-black",
                          set.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        )}
                      >
                        {set.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <PermissionSetActionsMenu onViewDetails={() => setDetailSetId(set.id)} />
                    </td>
                  </tr>
                );
              })}
              {permissionSets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[13px] font-semibold text-[#617099]">
                    No custom permission sets yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing 1 to {permissionSets.length} of {permissionSets.length} permission sets
          </p>
          <div className="flex items-center gap-2">
            <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
              <ChevronRight className="size-4 rotate-180" />
            </button>
            <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
            <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <PermissionSetManagementSummaryCard items={summary} />
        <RailCard title="About Permission Sets">
          <p className="text-[13px] font-semibold leading-6 text-[#34406B]">
            Permission sets define a collection of module permissions and can be
            assigned to roles. You can reuse permission sets across multiple
            roles and teams.
          </p>
          <Link
            href="/settings/roles"
            className="mt-4 inline-flex text-[13px] font-black text-[#4F46E5]"
          >
            Learn more about permission sets
            <ChevronRight className="size-4" />
          </Link>
        </RailCard>
        <PopularPermissionActionsCard onCreateSet={onCreateSet} />
        <NeedHelpCard />
      </aside>
    </div>
  );
}

function PermissionSetManagementSummaryCard({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <RailCard title="Permission Summary">
      <div className="flex items-center gap-5">
        <DonutChart items={items} />
        <div className="min-w-0 flex-1 space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#26345D]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-[#111827]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </RailCard>
  );
}

function PermissionSetDetailView({
  profiles,
  roles,
  profileRoles,
  permissionSet,
  permissionSetRules,
  rolePermissionSets,
  permissionActivityEvents,
  onBack,
  onBackToMatrix,
  onCreateSet,
}: {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  permissionSet: PermissionSetRow;
  permissionSetRules: PermissionRuleRow[];
  rolePermissionSets: RolePermissionSetRow[];
  permissionActivityEvents: SecurityEventRow[];
  onBack: () => void;
  onBackToMatrix: () => void;
  onCreateSet: () => void;
}) {
  const [activeDetailTab, setActiveDetailTab] =
    useState<PermissionSetDetailTab>("overview");
  const metadata = permissionSetVisual(0, permissionSet.color);
  const Icon = metadata.icon;
  const rolesUsing = rolePermissionSets.filter(
    (assignment) => assignment.permission_set_id === permissionSet.id
  ).length;
  const creator = profiles.find((profile) => profile.id === permissionSet.created_by);
  const creatorName = creator ? displayName(creator) : "System";
  const summary = buildPermissionSetSummary(permissionSet.id, permissionSetRules);
  const totalModules = permissionSetDetailModules.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[24px] font-black leading-tight text-[#111827]">
            Team Management
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[#26345D]">
            Manage your team members, roles, and permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-lg border-[#B9A8FF] px-5 text-[13px] font-black text-[#4F46E5]"
          >
            <Link href="/team-management?tab=roles">
              <UsersRound className="size-4" />
              View Role Hierarchy
            </Link>
          </Button>
          <Button
            type="button"
            onClick={onCreateSet}
            className="h-10 rounded-lg bg-[#4F46E5] px-5 text-[13px] font-black shadow-md shadow-indigo-200 hover:bg-[#4338CA]"
          >
            <Plus className="size-4" />
            Add Permission Set
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#26345D]">
        <button
          type="button"
          onClick={onBackToMatrix}
          className="font-black text-[#4F46E5] hover:underline"
        >
          Permissions
        </button>
        <ChevronRight className="size-4 text-[#7C89A8]" />
        <button
          type="button"
          onClick={onBack}
          className="font-black text-[#4F46E5] hover:underline"
        >
          Permission Sets
        </button>
        <ChevronRight className="size-4 text-[#7C89A8]" />
        <span className="text-[#17213F]">{permissionSet.name}</span>
        {activeDetailTab === "roles" ? (
          <>
            <ChevronRight className="size-4 text-[#7C89A8]" />
            <span className="text-[#17213F]">Roles Using</span>
          </>
        ) : null}
        {activeDetailTab === "activity" ? (
          <>
            <ChevronRight className="size-4 text-[#7C89A8]" />
            <span className="text-[#17213F]">Activity Log</span>
          </>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_318px]">
        <main className="min-w-0 space-y-5">
          <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/80">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-5">
                <span
                  className="flex size-20 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${metadata.color}18`, color: metadata.color }}
                >
                  <Icon className="size-9" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-[24px] font-black leading-tight text-[#111827]">
                    {permissionSet.name}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[14px] font-semibold leading-6 text-[#34406B]">
                    {permissionSet.description ||
                      "Reusable permission access for selected CRM modules."}
                  </p>
                  <Badge
                    className={cn(
                      "mt-3 rounded-md border-0 px-3 py-1 text-[12px] font-black",
                      permissionSet.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {permissionSet.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="grid min-w-[420px] max-w-full grid-cols-4 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-white">
                <PermissionSetHeroStat
                  icon={UsersRound}
                  label="Roles Using"
                  value={String(rolesUsing)}
                />
                <PermissionSetHeroStat
                  icon={ShieldCheck}
                  label="Created On"
                  value={formatShortDate(permissionSet.created_at)}
                />
                <PermissionSetHeroProfile label="Created By" profile={creator} fallback={creatorName} />
                <div className="flex items-center justify-end px-4">
                  <PermissionSetDetailActionsMenu
                    onViewDetails={() => setActiveDetailTab("overview")}
                    onViewChanges={() => setActiveDetailTab("activity")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-8 border-b border-slate-200 text-[13px] font-black text-[#26345D]">
              {permissionSetDetailTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  disabled={tab.disabled}
                  onClick={() => {
                    if (!tab.disabled) setActiveDetailTab(tab.key);
                  }}
                  className={cn(
                    "-mb-px pb-3 transition",
                    activeDetailTab === tab.key
                      ? "border-b-2 border-[#4F46E5] text-[#4F46E5]"
                      : tab.disabled
                        ? "cursor-not-allowed text-[#26345D]/70"
                        : "text-[#26345D] hover:text-[#4F46E5]"
                  )}
                  title={
                    tab.disabled
                      ? "Backend wiring for this tab is a later safe phase."
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeDetailTab === "overview" ? (
          <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-[16px] font-black text-[#111827]">
                  Permissions Overview
                </h3>
                <p className="mt-1 text-[13px] font-semibold text-[#34406B]">
                  View the access level for each module in this permission set.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                {permissionAccessLegend.map((item) => (
                  <span
                    key={item.access}
                    className="inline-flex items-center gap-2 text-[12px] font-bold text-[#26345D]"
                  >
                    <PermissionAccessDot access={item.access} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                    <th className="w-[28%] px-5 py-4">Permission Module</th>
                    {permissionAccessLegend.map((item) => (
                      <th key={item.access} className="px-4 py-4 text-center">
                        <span className="block">{item.label}</span>
                        <span className="mt-1 block text-[11px] font-semibold text-[#526187]">
                          {item.description}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionSetDetailModules.map((moduleName, index) => {
                    const moduleMeta = permissionModuleMeta(moduleName, index);
                    const access = permissionAccessForSetModule(
                      permissionSet.id,
                      moduleName,
                      permissionSetRules
                    );

                    return (
                      <tr key={moduleName} className="border-b border-slate-100 text-[#17213F]">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <IconBox
                              icon={moduleMeta.icon}
                              color={moduleMeta.color}
                              className="size-9 rounded-lg"
                            />
                            <div className="min-w-0">
                              <p className="text-[13px] font-black text-[#111827]">
                                {moduleMeta.label}
                              </p>
                              <p className="mt-0.5 max-w-[240px] text-[12px] font-semibold text-[#526187]">
                                {moduleMeta.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        {permissionAccessLegend.map((item) => (
                          <td key={item.access} className="px-4 py-3.5 text-center">
                            <ReadOnlyAccessRadio
                              access={item.access}
                              checked={access === item.access}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          ) : null}

          {activeDetailTab === "roles" ? (
            <PermissionSetRolesUsingSection
              profiles={profiles}
              roles={roles}
              profileRoles={profileRoles}
              permissionSet={permissionSet}
              rolePermissionSets={rolePermissionSets}
            />
          ) : null}

          {activeDetailTab === "activity" ? (
            <PermissionSetActivityLogSection
              profiles={profiles}
              permissionSet={permissionSet}
              events={permissionActivityEvents}
            />
          ) : null}

          {activeDetailTab === "history" ? (
            <PermissionSetHistorySection
              profiles={profiles}
              permissionSet={permissionSet}
              events={permissionActivityEvents}
            />
          ) : null}
        </main>

        <aside className="space-y-4">
          <RailCard title="Permission Summary">
            <div className="flex items-center gap-5">
              <DonutChart items={summary} />
              <div className="min-w-0 flex-1 space-y-2">
                {summary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-[12px] font-bold text-[#26345D]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="text-[#111827]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[13px] font-semibold text-[#526187]">Total Modules</p>
              <p className="mt-1 text-2xl font-black text-[#111827]">{totalModules}</p>
            </div>
          </RailCard>

          <RailCard title="About This Permission Set">
            <div className="space-y-4 text-[13px]">
              <PermissionSetAboutLine label="Permission Set Name" value={permissionSet.name} />
              <PermissionSetAboutLine
                label="Description"
                value={
                  permissionSet.description ||
                  "Reusable permission access for selected modules."
                }
              />
              <div>
                <p className="text-[12px] font-black text-[#26345D]">Status</p>
                <Badge
                  className={cn(
                    "mt-1 rounded-md border-0 px-2 py-1 text-[11px] font-black",
                    permissionSet.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  )}
                >
                  {permissionSet.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-[12px] font-black text-[#26345D]">Created By</p>
                <div className="mt-1 flex items-center gap-2">
                  {creator ? <Avatar profile={creator} size="sm" /> : null}
                  <span className="font-semibold text-[#17213F]">{creatorName}</span>
                </div>
              </div>
              <PermissionSetAboutLine
                label="Created On"
                value={formatShortDate(permissionSet.created_at)}
              />
              <PermissionSetAboutLine
                label="Last Updated"
                value={formatShortDate(permissionSet.updated_at)}
              />
            </div>
          </RailCard>

          <RailCard title="Actions">
            <div className="space-y-3">
              {[
                {
                  icon: Pencil,
                  title: "Edit Permission Set",
                  description: "Modify this permission set",
                },
                {
                  icon: Copy,
                  title: "Duplicate Permission Set",
                  description: "Create a copy of this permission set",
                },
                {
                  icon: UsersRound,
                  title: "Assign to Roles",
                  description: "Assign this set to roles",
                },
                {
                  icon: Archive,
                  title: "Deactivate Permission Set",
                  description: "Deactivate this permission set",
                  danger: true,
                },
              ].map((action) => {
                const ActionIcon = action.icon;

                return (
                  <button
                    key={action.title}
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl p-1.5 text-left opacity-70"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        action.danger
                          ? "bg-rose-50 text-rose-600"
                          : "bg-[#F1ECFF] text-[#4F46E5]"
                      )}
                    >
                      <ActionIcon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[13px] font-black",
                          action.danger ? "text-rose-600" : "text-[#111827]"
                        )}
                      >
                        {action.title}
                      </span>
                      <span className="block text-[12px] font-semibold text-[#617099]">
                        {action.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </RailCard>
        </aside>
      </div>
    </div>
  );
}

function PermissionSetHeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4">
      <Icon className="size-4 shrink-0 text-[#26345D]" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-black text-[#111827]">{value}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#526187]">{label}</p>
      </div>
    </div>
  );
}

function PermissionSetRolesUsingSection({
  profiles,
  roles,
  profileRoles,
  permissionSet,
  rolePermissionSets,
}: {
  profiles: ProfileRow[];
  roles: RoleRow[];
  profileRoles: ProfileRoleRow[];
  permissionSet: PermissionSetRow;
  rolePermissionSets: RolePermissionSetRow[];
}) {
  const [search, setSearch] = useState("");
  const assignedRows = rolePermissionSets
    .filter((assignment) => assignment.permission_set_id === permissionSet.id)
    .map((assignment, index) => {
      const role = roles.find((candidate) => candidate.id === assignment.role_id);
      const assignedBy = profiles.find((profile) => profile.id === assignment.assigned_by);
      const usersAssigned = profileRoles.filter(
        (profileRole) => profileRole.role_id === assignment.role_id
      ).length;

      return { assignment, assignedBy, index, role, usersAssigned };
    })
    .filter((row): row is {
      assignment: RolePermissionSetRow;
      assignedBy: ProfileRow | undefined;
      index: number;
      role: RoleRow;
      usersAssigned: number;
    } => Boolean(row.role))
    .filter((row) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;

      return [
        row.role.name,
        row.role.description,
        row.assignedBy ? displayName(row.assignedBy) : "System",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const aTime = a.assignment.assigned_at
        ? new Date(a.assignment.assigned_at).getTime()
        : 0;
      const bTime = b.assignment.assigned_at
        ? new Date(b.assignment.assigned_at).getTime()
        : 0;

      return bTime - aTime;
    });
  const totalRows = assignedRows.length;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
      <div className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-[17px] font-black text-[#111827]">
          Roles Using this Permission Set
        </h3>
        <p className="mt-2 text-[13px] font-semibold text-[#34406B]">
          These roles have been assigned the {permissionSet.name} permission set.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C89A8]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search roles..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          title="Assign-to-roles modal is intentionally disabled until its safe mutation flow is built."
          className="h-10 rounded-xl border-[#B9A8FF] px-4 text-[13px] font-black text-[#4F46E5]"
        >
          <UsersRound className="size-4" />
          Assign to Roles
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
              <th className="w-[24%] px-5 py-4">Role Name</th>
              <th className="w-[24%] px-3 py-4">Description</th>
              <th className="px-3 py-4">Users Assigned</th>
              <th className="px-3 py-4">Assigned On</th>
              <th className="px-3 py-4">Assigned By</th>
              <th className="w-[8%] px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignedRows.map((row) => {
              const tone = teamTone(row.index);
              const Icon = roleIcon(row.index);

              return (
                <tr key={row.assignment.role_id} className="border-b border-slate-100 text-[#17213F]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <IconBox
                        icon={Icon}
                        color={row.role.color || tone.color}
                        className="size-9 rounded-lg"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black text-[#111827]">
                          {row.role.name}
                        </p>
                        <Badge
                          className={cn(
                            "mt-1 rounded-md border-0 px-2 py-0.5 text-[10px] font-black",
                            row.role.role_type === "custom"
                              ? "bg-[#E7F8EE] text-emerald-700"
                              : "bg-[#F1ECFF] text-[#4F46E5]"
                          )}
                        >
                          {row.role.role_type === "custom" ? "Custom Role" : "System Role"}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="max-w-[240px] text-[13px] font-semibold leading-6 text-[#26345D]">
                      {row.role.description || "No description added for this role."}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#26345D]">
                      <UsersRound className="size-4" />
                      {row.usersAssigned}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                    {formatShortDate(row.assignment.assigned_at)}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      {row.assignedBy ? <Avatar profile={row.assignedBy} size="sm" /> : null}
                      <span className="text-[13px] font-black text-[#17213F]">
                        {row.assignedBy ? displayName(row.assignedBy) : "System"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <PermissionSetRoleAssignmentActionsMenu roleName={row.role.name} />
                  </td>
                </tr>
              );
            })}
            {assignedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[13px] font-semibold text-[#617099]">
                  No roles are assigned to this permission set yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {totalRows > 0 ? 1 : 0} to {totalRows} of {totalRows} roles
        </p>
        <div className="flex items-center gap-2">
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PermissionSetRoleAssignmentActionsMenu({ roleName }: { roleName: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
          aria-label={`Open ${roleName} permission assignment actions`}
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200 bg-white p-2 shadow-xl">
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Eye className="size-4" />
          View Role Details
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Pencil className="size-4" />
          Manage Role
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold text-rose-600">
          <UserX className="size-4" />
          Unassign Permission Set
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PermissionSetActivityLogSection({
  profiles,
  permissionSet,
  events,
}: {
  profiles: ProfileRow[];
  permissionSet: PermissionSetRow;
  events: SecurityEventRow[];
}) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const setEvents = events.filter((event) =>
    securityEventBelongsToPermissionSet(event, permissionSet.id)
  );

  const userOptions = Array.from(new Set(setEvents.map((event) => event.user_id)))
    .map((userId) => profiles.find((profile) => profile.id === userId))
    .filter((profile): profile is ProfileRow => Boolean(profile));

  const permissionEvents = setEvents
    .filter((event) => {
      const detail = permissionActivityDetail(event);

      if (actionFilter !== "all" && detail.actionKey !== actionFilter) {
        return false;
      }

      if (userFilter !== "all" && event.user_id !== userFilter) {
        return false;
      }

      return true;
    })
    .filter((event) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;

      const actor = profiles.find((profile) => profile.id === event.user_id);
      const detail = permissionActivityDetail(event);

      return [
        actor ? displayName(actor) : "System",
        event.event_type,
        detail.actionLabel,
        detail.moduleDetail,
        detail.changeText,
        event.ip_address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .slice(0, 8);

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
      <div className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-[17px] font-black text-[#111827]">Activity Log</h3>
        <p className="mt-2 text-[13px] font-semibold text-[#34406B]">
          Track all changes and updates made to this permission set.
        </p>
      </div>

      <div className="grid gap-3 border-b border-slate-200 px-5 py-4 md:grid-cols-[minmax(180px,1fr)_minmax(210px,1fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C89A8]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search activities..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
          />
        </div>
        <select className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none">
          <option>May 1, 2025 - May 14, 2025</option>
        </select>
        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none"
        >
          <option value="all">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="assigned">Assigned</option>
        </select>
        <select
          value={userFilter}
          onChange={(event) => setUserFilter(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-[#111827] outline-none"
        >
          <option value="all">All Users</option>
          {userOptions.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {displayName(profile)}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-[#B9A8FF] px-4 text-[13px] font-black text-[#4F46E5]"
        >
          <Filter className="size-4" />
          Filter
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
              <th className="w-[15%] px-5 py-4">Date &amp; Time</th>
              <th className="w-[18%] px-3 py-4">User</th>
              <th className="w-[15%] px-3 py-4">Action</th>
              <th className="w-[16%] px-3 py-4">Module / Detail</th>
              <th className="w-[20%] px-3 py-4">Changes</th>
              <th className="px-3 py-4">IP Address</th>
              <th className="w-[6%] px-4 py-4 text-right" />
            </tr>
          </thead>
          <tbody>
            {permissionEvents.map((event) => {
              const actor = profiles.find((profile) => profile.id === event.user_id);
              const detail = permissionActivityDetail(event);

              return (
                <tr key={event.id} className="border-b border-slate-100 text-[#17213F]">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-bold text-[#17213F]">
                      {formatShortDate(event.created_at)}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-[#26345D]">
                      {formatTimeOnly(event.created_at)}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      {actor ? <Avatar profile={actor} size="sm" /> : null}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black text-[#111827]">
                          {actor ? displayName(actor) : "System"}
                        </p>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#526187]">
                          {actor?.job_title || actor?.role || "System"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <PermissionActivityActionLabel detail={detail} />
                  </td>
                  <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                    {detail.moduleDetail}
                  </td>
                  <td className="px-3 py-4">
                    <p className="max-w-[250px] text-[13px] font-semibold leading-6 text-[#26345D]">
                      {detail.changeText}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-[13px] font-semibold text-[#26345D]">
                    {event.ip_address || "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <PermissionActivityActionsMenu />
                  </td>
                </tr>
              );
            })}
            {permissionEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-[13px] font-semibold text-[#617099]">
                  No permission-set activity has been recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {permissionEvents.length > 0 ? 1 : 0} to {permissionEvents.length} of {permissionEvents.length} activities
        </p>
        <div className="flex items-center gap-2">
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PermissionActivityActionLabel({
  detail,
}: {
  detail: ReturnType<typeof permissionActivityDetail>;
}) {
  const Icon = detail.icon;

  return (
    <span
      className="inline-flex items-center gap-2 text-[13px] font-black"
      style={{ color: detail.color }}
    >
      <Icon className="size-4" />
      {detail.actionLabel}
    </span>
  );
}

function PermissionActivityActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
          aria-label="Open activity actions"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 bg-white p-2 shadow-xl">
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Pencil className="size-4" />
          View Changes
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <SlidersHorizontal className="size-4" />
          Compare Changes
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Archive className="size-4" />
          Export Activity
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Copy className="size-4" />
          Copy Log Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PermissionSetHistorySection({
  profiles,
  permissionSet,
  events,
}: {
  profiles: ProfileRow[];
  permissionSet: PermissionSetRow;
  events: SecurityEventRow[];
}) {
  const [search, setSearch] = useState("");
  const allHistoryEvents = events.filter((event) =>
    securityEventBelongsToPermissionSet(event, permissionSet.id)
  );
  const historyRows = allHistoryEvents
    .filter((event) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;

      const actor = profiles.find((profile) => profile.id === event.user_id);
      const detail = permissionActivityDetail(event);

      return [
        actor ? displayName(actor) : "System",
        detail.actionLabel,
        detail.moduleDetail,
        detail.changeText,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .slice(0, 8);

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm shadow-slate-100/80">
      <div className="border-b border-slate-200 px-5 py-5">
        <h3 className="text-[17px] font-black text-[#111827]">History</h3>
        <p className="mt-2 text-[13px] font-semibold text-[#34406B]">
          View all versions and changes made to this permission set.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C89A8]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search history..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] font-semibold text-[#111827] outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-10 rounded-xl border-[#B9A8FF] px-4 text-[13px] font-black text-[#4F46E5] disabled:opacity-60"
        >
          <SlidersHorizontal className="size-4" />
          Compare Versions
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
              <th className="w-[13%] px-5 py-4">Version</th>
              <th className="w-[16%] px-3 py-4">Date &amp; Time</th>
              <th className="w-[18%] px-3 py-4">Changed By</th>
              <th className="px-3 py-4">Changes Summary</th>
              <th className="w-[14%] px-3 py-4">Change Type</th>
              <th className="w-[6%] px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((event, index) => {
              const actor = profiles.find((profile) => profile.id === event.user_id);
              const detail = permissionActivityDetail(event);
              const version = Math.max(1, allHistoryEvents.length - index);

              return (
                <tr key={event.id} className="border-b border-slate-100 text-[#17213F]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-[#17213F]">
                        Version {version}
                      </span>
                      {index === 0 ? (
                        <span className="rounded-md bg-[#EEE9FF] px-2 py-0.5 text-[11px] font-black text-[#4F46E5]">
                          Current
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-[13px] font-bold text-[#17213F]">
                      {formatShortDate(event.created_at)}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-[#26345D]">
                      {formatTimeOnly(event.created_at)}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      {actor ? <Avatar profile={actor} size="sm" /> : null}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black text-[#111827]">
                          {actor ? displayName(actor) : "System"}
                        </p>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#526187]">
                          {actor?.job_title || actor?.role || "System"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="max-w-[390px] text-[13px] font-semibold leading-6 text-[#26345D]">
                      {detail.changeText}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className="inline-flex rounded-md px-2 py-1 text-[11px] font-black"
                      style={{
                        backgroundColor: `${detail.color}1A`,
                        color: detail.color,
                      }}
                    >
                      {detail.actionLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <PermissionActivityActionsMenu />
                  </td>
                </tr>
              );
            })}
            {historyRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[13px] font-semibold text-[#617099]">
                  No permission-set history has been recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 text-[13px] font-semibold text-[#26345D] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {historyRows.length > 0 ? 1 : 0} to {historyRows.length} of {historyRows.length} history records
        </p>
        <div className="flex items-center gap-2">
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#617099]">
            <ChevronRight className="size-4 rotate-180" />
          </button>
          <button className="flex size-9 items-center justify-center rounded-lg bg-[#4F46E5] text-sm font-black text-white shadow-md shadow-indigo-200">1</button>
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-[#26345D]">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PermissionSetDetailActionsMenu({
  onViewDetails,
  onViewChanges,
}: {
  onViewDetails: () => void;
  onViewChanges: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-[#B9A8FF] text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
          aria-label="Open permission set detail actions"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 bg-white p-2 shadow-xl">
        <DropdownMenuItem onClick={onViewDetails} className="gap-3 rounded-lg text-[13px] font-bold">
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewChanges} className="gap-3 rounded-lg text-[13px] font-bold">
          <Pencil className="size-4" />
          View Changes
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <SlidersHorizontal className="size-4" />
          Compare Changes
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Archive className="size-4" />
          Export Activity
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Copy className="size-4" />
          Copy Log Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PermissionSetHeroProfile({
  label,
  profile,
  fallback,
}: {
  label: string;
  profile?: ProfileRow | null;
  fallback: string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4">
      {profile ? <Avatar profile={profile} size="sm" /> : <UserRound className="size-4 text-[#26345D]" />}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-black text-[#111827]">{fallback}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-[#526187]">{label}</p>
      </div>
    </div>
  );
}

function PermissionSetAboutLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-black text-[#26345D]">{label}</p>
      <p className="mt-1 font-semibold leading-5 text-[#17213F]">{value}</p>
    </div>
  );
}

function ReadOnlyAccessRadio({
  access,
  checked,
}: {
  access: (typeof crmAccessLevels)[number];
  checked: boolean;
}) {
  const color = permissionAccessColor(access);

  return (
    <span
      className="inline-flex size-4 items-center justify-center rounded-full border"
      style={{
        borderColor: checked ? color : "#CBD5E1",
        backgroundColor: checked ? `${color}15` : "transparent",
      }}
    >
      {checked ? (
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      ) : null}
    </span>
  );
}

function PermissionSetActionsMenu({
  onViewDetails,
}: {
  onViewDetails: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl text-[#26345D] transition hover:bg-[#F1ECFF] hover:text-[#4F46E5]"
          aria-label="Open permission set actions"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200 bg-white p-2 shadow-xl">
        <DropdownMenuItem
          onClick={onViewDetails}
          className="gap-3 rounded-lg text-[13px] font-bold"
        >
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Pencil className="size-4" />
          Edit Permission Set
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <UsersRound className="size-4" />
          Assign to Roles
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold">
          <Boxes className="size-4" />
          Manage Modules
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold text-rose-600">
          <Archive className="size-4" />
          Deactivate
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="gap-3 rounded-lg text-[13px] font-bold text-rose-600">
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PopularPermissionActionsCard({ onCreateSet }: { onCreateSet: () => void }) {
  const actions = [
    {
      icon: Plus,
      title: "Create Permission Set",
      description: "Define a new set of permissions",
      onClick: onCreateSet,
    },
    {
      icon: Copy,
      title: "Duplicate Permission Set",
      description: "Copy permissions from existing set",
      disabled: true,
    },
    {
      icon: SlidersHorizontal,
      title: "Assign Permissions",
      description: "Assign set to roles or teams",
      disabled: true,
    },
    {
      icon: KeyRound,
      title: "Permission Audit Log",
      description: "View permission changes",
      href: "/settings/audit-logs",
    },
  ];

  return (
    <RailCard title="Popular Actions">
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-black text-[#111827]">
                  {action.title}
                </span>
                <span className="block text-[12px] font-semibold text-[#617099]">
                  {action.description}
                </span>
              </span>
            </>
          );

          if (action.href) {
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-[#F8F7FF]"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={action.title}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-[#F8F7FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {content}
            </button>
          );
        })}
      </div>
    </RailCard>
  );
}

function PermissionAccessLabel({
  access,
}: {
  access: (typeof crmAccessLevels)[number];
}) {
  const config = {
    full_access: {
      icon: CheckCircle2,
      label: "Full Access",
      className: "text-emerald-700",
    },
    edit: {
      icon: Pencil,
      label: "Edit",
      className: "text-orange-600",
    },
    view_only: {
      icon: Eye,
      label: "View Only",
      className: "text-blue-700",
    },
    no_access: {
      icon: UserX,
      label: "No Access",
      className: "text-red-600",
    },
    not_applicable: {
      icon: MoreVertical,
      label: "Not Applicable",
      className: "text-slate-500",
    },
  }[access];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-2 text-[12px] font-black", config.className)}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function SetPermissionsModal({
  moduleName,
  roles,
  rolePermissions,
  disabled,
  onClose,
  onSave,
}: {
  moduleName: (typeof crmModuleNames)[number];
  roles: RoleRow[];
  rolePermissions: RolePermissionRow[];
  disabled: boolean;
  onClose: () => void;
  onSave: (
    updates: Array<{
      role_id: string;
      module_name: (typeof crmModuleNames)[number];
      access_level: (typeof crmAccessLevels)[number];
    }>
  ) => void;
}) {
  const metadata = permissionModuleMeta(moduleName, 0);
  const selectedRoles = roles.slice(0, 8);
  const summary = buildModulePermissionSummary(moduleName, selectedRoles, rolePermissions);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/35 px-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl shadow-slate-900/20">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const updates = selectedRoles.map((role) => ({
              role_id: role.id,
              module_name: moduleName,
              access_level: String(formData.get(`role-${role.id}`)) as (typeof crmAccessLevels)[number],
            }));
            onSave(updates);
          }}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={onClose}
                className="mb-2 inline-flex items-center gap-2 text-[13px] font-black text-[#26345D]"
              >
                <ChevronRight className="size-4 rotate-180" />
                Set Permissions
              </button>
              <p className="text-[13px] font-semibold text-[#34406B]">
                Define permissions for this module across different roles.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl text-[#26345D] hover:bg-slate-100"
              aria-label="Close permissions modal"
            >
              x
            </button>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <section className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <IconBox icon={metadata.icon} color={metadata.color} />
                  <div>
                    <h2 className="text-2xl font-black text-[#111827]">{metadata.label}</h2>
                    <p className="text-sm font-semibold text-[#526187]">
                      {metadata.description}
                    </p>
                    <p className="mt-2 text-[12px] font-semibold text-[#617099]">
                      {selectedRoles.length} roles loaded from backend
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
                >
                  <Link href={permissionModulePath(moduleName)}>
                    <Eye className="size-4" />
                    View Module Details
                  </Link>
                </Button>
              </section>

              <section className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-[16px] font-black text-[#111827]">
                    Permissions by Role
                  </h3>
                  <p className="mt-1 text-[13px] font-semibold text-[#34406B]">
                    Choose the level of access each role has for this module.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-[13px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                        <th className="w-[30%] px-5 py-4">Role</th>
                        {crmAccessLevels.slice(0, 4).map((access) => (
                          <th key={access} className="px-4 py-4 text-center">
                            <PermissionAccessLabel access={access} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoles.map((role, index) => {
                        const access = permissionAccessForRole(
                          role,
                          moduleName,
                          rolePermissions
                        );
                        return (
                          <tr key={role.id} className="border-b border-slate-100">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <IconBox
                                  icon={roleIcon(index)}
                                  color={role.color || teamTone(index).color}
                                />
                                <div>
                                  <p className="text-[13px] font-black text-[#111827]">
                                    {role.name}
                                  </p>
                                  <p className="text-[12px] font-semibold text-[#526187]">
                                    {role.description || "Custom role assignments"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {crmAccessLevels.slice(0, 4).map((level) => (
                              <td key={level} className="px-4 py-4 text-center">
                                <input
                                  type="radio"
                                  name={`role-${role.id}`}
                                  value={level}
                                  defaultChecked={access === level}
                                  disabled={disabled}
                                  className="size-5 accent-[#4F46E5]"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <PermissionGuideCard />
              <PermissionSummaryCard items={summary} total={selectedRoles.length} />
              <RailCard title="Custom Role">
                <p className="text-[13px] font-semibold leading-6 text-[#34406B]">
                  Permissions for custom roles can be managed from the Roles section.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 h-10 w-full rounded-xl border-[#B9A8FF] text-[13px] font-black text-[#4F46E5]"
                >
                  <Link href="/team-management?tab=roles">
                    Go to Roles
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </RailCard>
            </aside>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl">
              Reset
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={disabled}
                className="h-10 rounded-xl bg-[#4F46E5] px-5 font-black hover:bg-[#4338CA]"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function PermissionGuideCard() {
  return (
    <RailCard title="Permission Guide">
      <div className="space-y-4">
        <PermissionAccessLabel access="full_access" />
        <p className="-mt-3 ml-6 text-[12px] font-semibold text-[#526187]">
          Can view, create, edit and delete all data.
        </p>
        <PermissionAccessLabel access="edit" />
        <p className="-mt-3 ml-6 text-[12px] font-semibold text-[#526187]">
          Can view, create and edit data.
        </p>
        <PermissionAccessLabel access="view_only" />
        <p className="-mt-3 ml-6 text-[12px] font-semibold text-[#526187]">
          Can only view data.
        </p>
        <PermissionAccessLabel access="no_access" />
        <p className="-mt-3 ml-6 text-[12px] font-semibold text-[#526187]">
          No access to this module.
        </p>
      </div>
    </RailCard>
  );
}

const permissionSetDetailModules = [
  "dashboard",
  "customers",
  "leads",
  "projects",
  "invoices",
  "field_jobs",
  "inventory",
  "reports",
  "settings",
  "users",
] satisfies Array<(typeof crmModuleNames)[number]>;

const permissionSetDetailTabs = [
  { key: "overview", label: "Overview", disabled: false },
  { key: "roles", label: "Roles Using", disabled: false },
  { key: "activity", label: "Activity Log", disabled: false },
  { key: "history", label: "History", disabled: false },
] as const;

type PermissionSetDetailTab = (typeof permissionSetDetailTabs)[number]["key"];

const permissionSetModalModules = [
  "dashboard",
  "customers",
  "leads",
  "projects",
  "invoices",
  "inventory",
  "reports",
  "settings",
  "users",
] satisfies Array<(typeof crmModuleNames)[number]>;

const permissionAccessLegend = [
  {
    access: "full_access",
    label: "Full Access",
    description: "All permissions",
    color: "#12B981",
  },
  {
    access: "edit",
    label: "Edit",
    description: "Modify & manage",
    color: "#F59E0B",
  },
  {
    access: "view_only",
    label: "View Only",
    description: "Read only access",
    color: "#1D8BFF",
  },
  {
    access: "no_access",
    label: "No Access",
    description: "No permissions",
    color: "#F43F5E",
  },
  {
    access: "not_applicable",
    label: "Not Applicable",
    description: "Not relevant",
    color: "#8B8EA8",
  },
] satisfies Array<{
  access: (typeof crmAccessLevels)[number];
  label: string;
  description: string;
  color: string;
}>;

function CreatePermissionSetModal({
  roles,
  permissionSets,
  permissionSetRules,
  disabled,
  onClose,
  onCreate,
}: {
  roles: RoleRow[];
  permissionSets: PermissionSetRow[];
  permissionSetRules: PermissionRuleRow[];
  disabled: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => void;
}) {
  const [description, setDescription] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const customPermissionSets = permissionSets.filter((set) => !set.is_system);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-5 py-6 backdrop-blur-[2px]">
      <section className="max-h-[calc(100vh-48px)] w-full max-w-[92rem] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/25">
        <div className="flex items-start justify-between gap-4 px-7 pb-5 pt-7">
          <div>
            <h2 className="text-[22px] font-black leading-tight text-[#111827]">
              Create Permission Set
            </h2>
            <p className="mt-1.5 text-[15px] font-semibold text-[#26345D]">
              Define a new set of permissions to control access across BYTECH CRM.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl text-[#17213F] transition hover:bg-slate-100"
            aria-label="Close permission set modal"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="flex max-h-[calc(100vh-150px)] flex-col overflow-hidden px-5 pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(new FormData(event.currentTarget));
            event.currentTarget.reset();
            setDescription("");
            setSelectedRoleIds([]);
            onClose();
          }}
        >
          <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="space-y-7 overflow-y-auto border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
              <div>
                <h3 className="text-[16px] font-black text-[#111827]">Basic Information</h3>
              </div>

              <label className="block">
                <span className="text-[13px] font-black text-[#17213F]">
                  Permission Set Name <span className="text-red-500">*</span>
                </span>
                <Input
                  name="name"
                  placeholder="Enter permission set name"
                  required
                  className="mt-3 h-10 rounded-lg border-slate-200 text-[13px] font-semibold shadow-none"
                />
              </label>

              <label className="block">
                <span className="text-[13px] font-black text-[#17213F]">
                  Description
                </span>
                <div className="relative mt-3">
                  <textarea
                    name="description"
                    value={description}
                    maxLength={200}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Enter description (optional)"
                    className="min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-[13px] font-semibold text-[#111827] outline-none transition placeholder:text-[#7C89A8] focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
                  />
                  <span className="absolute bottom-3 right-3 text-[12px] font-semibold text-[#6B789C]">
                    {description.length}/200
                  </span>
                </div>
              </label>

              <div className="h-px bg-slate-200" />

              <label className="block">
                <span className="text-[14px] font-black text-[#17213F]">
                  Assign to Roles <span className="font-semibold text-[#526187]">(Optional)</span>
                </span>
                <span className="mt-2 block text-[13px] font-semibold text-[#526187]">
                  Select roles that will use this permission set.
                </span>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex h-10 items-center justify-between border-b border-slate-100 px-3">
                    <span className="text-[13px] font-semibold text-[#6B789C]">
                      {selectedRoleIds.length > 0
                        ? `${selectedRoleIds.length} role${selectedRoleIds.length === 1 ? "" : "s"} selected`
                        : "Select roles"}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#4F46E5]">
                      Multi
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto p-1.5">
                    {roles.map((role) => {
                      const checked = selectedRoleIds.includes(role.id);

                      return (
                        <label
                          key={role.id}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition hover:bg-[#F8F7FF]",
                            checked && "bg-[#F1ECFF]"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-black text-[#17213F]">
                              {role.name}
                            </span>
                            <span className="text-[11px] font-semibold capitalize text-[#6B789C]">
                              {role.role_type} role
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            name="assigned_role_ids"
                            value={role.id}
                            checked={checked}
                            onChange={(event) =>
                              setSelectedRoleIds((current) =>
                                event.target.checked
                                  ? [...current, role.id]
                                  : current.filter((id) => id !== role.id)
                              )
                            }
                            className="size-4 accent-[#4F46E5]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </label>

              <div className="h-px bg-slate-200" />

              <label className="block">
                <span className="text-[14px] font-black text-[#17213F]">
                  Copy from Existing <span className="font-semibold text-[#526187]">(Optional)</span>
                </span>
                <span className="mt-2 block text-[13px] font-semibold text-[#526187]">
                  Save time by copying permissions from an existing set.
                </span>
                <select
                  name="copy_from_permission_set_id"
                  className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-[#26345D] outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15"
                  defaultValue=""
                >
                  <option value="">Select permission set</option>
                  {customPermissionSets.map((set) => {
                    const ruleCount = permissionSetRules.filter(
                      (rule) => rule.permission_set_id === set.id
                    ).length;
                    return (
                      <option key={set.id} value={set.id}>
                        {set.name} ({ruleCount} rules)
                      </option>
                    );
                  })}
                </select>
              </label>
            </aside>

            <section className="min-w-0 overflow-y-auto p-6">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h3 className="text-[16px] font-black text-[#111827]">Permissions</h3>
                  <p className="mt-1 text-[13px] font-semibold text-[#526187]">
                    Set the level of access for each module.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
                  {[
                    ["full_access", "Full Access", "All permissions"],
                    ["edit", "Edit", "Modify & manage"],
                    ["view_only", "View Only", "Read only access"],
                    ["no_access", "No Access", "No permissions"],
                  ].map(([access, label, detail]) => (
                    <div key={access} className="flex items-start gap-2">
                      <PermissionAccessDot access={access as (typeof crmAccessLevels)[number]} />
                      <div>
                        <p className="font-black text-[#17213F]">{label}</p>
                        <p className="mt-0.5 font-semibold text-[#526187]">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[12px] font-black text-[#26345D]">
                      <th className="w-[34%] px-0 py-3">Permission Module</th>
                      <th className="px-4 py-3 text-center text-emerald-700">Full Access</th>
                      <th className="px-4 py-3 text-center text-orange-600">Edit</th>
                      <th className="px-4 py-3 text-center text-blue-700">View Only</th>
                      <th className="px-4 py-3 text-center text-red-600">No Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionSetModalModules.map((moduleName, index) => {
                      const metadata = permissionModuleMeta(moduleName, index);
                      return (
                        <tr key={moduleName} className="border-b border-slate-100">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <IconBox
                                icon={metadata.icon}
                                color={metadata.color}
                                className="size-9 rounded-lg"
                              />
                              <div>
                                <p className="text-[13px] font-black text-[#111827]">
                                  {metadata.label}
                                </p>
                                <p className="mt-0.5 text-[12px] font-semibold text-[#526187]">
                                  {metadata.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          {(["full_access", "edit", "view_only", "no_access"] as const).map(
                            (access) => (
                              <td key={access} className="px-4 py-3.5 text-center">
                                <input
                                  type="radio"
                                  name={`permission-${moduleName}`}
                                  value={access}
                                  className="size-4 accent-[#4F46E5]"
                                  aria-label={`${metadata.label} ${formatLabel(access)}`}
                                />
                              </td>
                            )
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-2 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-lg border-slate-200 px-7 text-[13px] font-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="h-10 rounded-lg bg-[#4F46E5] px-7 text-[13px] font-black shadow-md shadow-indigo-200 hover:bg-[#4338CA]"
            >
              Create Permission Set
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PermissionAccessDot({
  access,
}: {
  access: (typeof crmAccessLevels)[number];
}) {
  const color = {
    full_access: "bg-emerald-500",
    edit: "bg-orange-500",
    view_only: "bg-blue-600",
    no_access: "bg-rose-500",
    not_applicable: "bg-slate-400",
  }[access];

  return <span className={cn("mt-1 size-2.5 rounded-full", color)} />;
}

function RoleHierarchyView({
  roles,
  roleUserCount,
  profileCount,
}: {
  roles: RoleRow[];
  roleUserCount: Map<string, number>;
  profileCount: number;
}) {
  const topRoles = roles
    .filter((role) => !role.parent_role_id)
    .sort((a, b) => b.role_level - a.role_level);
  const childRoles = roles.filter((role) => role.parent_role_id);
  const systemRoles = roles.filter((role) => role.role_type === "system");
  const customRoles = roles.filter((role) => role.role_type === "custom");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-[1.5rem] border border-indigo-100/70 bg-white p-5 shadow-sm shadow-indigo-100/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#111827]">Role Hierarchy</h2>
            <p className="text-sm font-medium text-slate-500">
              Real roles arranged by parent relationship and role level.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-7">
          {topRoles.map((role) => (
            <div key={role.id} className="space-y-5">
              <HierarchyRoleCard role={role} users={roleUserCount.get(role.id) ?? 0} centered />
              <div className="grid gap-4 md:grid-cols-3">
                {childRoles
                  .filter((child) => child.parent_role_id === role.id)
                  .map((child) => (
                    <HierarchyRoleCard
                      key={child.id}
                      role={child}
                      users={roleUserCount.get(child.id) ?? 0}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-5">
        <FormCard title="Hierarchy Summary" description="">
          <div className="space-y-4">
            <SummaryLine label="Total Roles" value={roles.length} />
            <SummaryLine label="System Roles" value={systemRoles.length} />
            <SummaryLine label="Custom Roles" value={customRoles.length} />
            <SummaryLine label="Total Users" value={profileCount} />
          </div>
        </FormCard>
        <FormCard title="Legend" description="">
          <div className="space-y-3 text-sm font-bold text-slate-700">
            <LegendLine color="#4F46E5" label="System Role" />
            <LegendLine color="#10B981" label="Custom Role" />
            <LegendLine color="#94A3B8" label="Reporting Line" />
          </div>
        </FormCard>
      </aside>
    </div>
  );
}

function RoleTable({
  roles,
  roleUserCount,
}: {
  roles: RoleRow[];
  roleUserCount: Map<string, number>;
}) {
  return (
    <section className="rounded-[1.5rem] border border-indigo-100/70 bg-white p-4 shadow-sm shadow-indigo-100/60">
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[#F8F7FF] text-xs font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Role Name</th>
              <th className="px-4 py-3 text-left">Role Type</th>
              <th className="px-4 py-3 text-left">Reports To</th>
              <th className="px-4 py-3 text-left">Users</th>
              <th className="px-4 py-3 text-left">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((role) => {
              const parent = roles.find((item) => item.id === role.parent_role_id);
              return (
                <tr key={role.id} className="hover:bg-indigo-50/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <IconBox icon={ShieldCheck} color={role.color} />
                      <span className="font-black text-[#111827]">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={role.role_type === "system" ? "default" : "success"}>
                      {formatLabel(role.role_type)} Role
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {parent?.name ?? "Top Level"}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {roleUserCount.get(role.id) ?? 0}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-600">
                    {role.description ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleCreateForm({
  roles,
  disabled,
  onSubmit,
}: {
  roles: RoleRow[];
  disabled: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <FormCard title="Create Role" description="Creates a real custom role. Existing system roles stay protected.">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
          event.currentTarget.reset();
        }}
      >
        <Input name="name" placeholder="Role name" required />
        <Input name="description" placeholder="Description optional" />
        <select name="parent_role_id" className={selectClassName} defaultValue="">
          <option value="">Reports to optional</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <Input name="role_level" type="number" defaultValue="50" min={0} max={1000} />
        <select name="color" className={selectClassName} defaultValue="#4F46E5">
          {roleColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={disabled} className="w-full">
          <Plus className="size-4" />
          Create Role
        </Button>
      </form>
    </FormCard>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "purple" | "green" | "orange" | "blue";
}) {
  const toneClass = {
    purple: "bg-[#F1ECFF] text-[#4F46E5]",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
  }[tone];

  return (
    <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100/80">
      <div className="flex items-center gap-5">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", toneClass)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-black text-[#26345D]">{label}</p>
          <p className="mt-1 text-[1.55rem] font-black leading-none text-[#111827]">
            {value}
          </p>
          <p className="mt-2 text-[13px] font-semibold text-[#34406B]">{hint}</p>
        </div>
      </div>
    </section>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-indigo-100/70 bg-white p-4 shadow-sm shadow-indigo-100/60">
      <h3 className="font-black text-[#111827]">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Avatar({
  profile,
  size = "md",
}: {
  profile: ProfileRow;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-[#F1ECFF] font-black text-[#4F46E5]",
        size === "sm" ? "size-9 rounded-full text-xs" : "size-10 rounded-2xl text-sm"
      )}
    >
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="" className="size-full object-cover" />
      ) : (
        initials(displayName(profile))
      )}
    </span>
  );
}

function IconBox({
  icon: Icon,
  color,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-2xl",
        className
      )}
      style={{ backgroundColor: `${color}18`, color }}
    >
      <Icon className="size-5" />
    </span>
  );
}

function HierarchyRoleCard({
  role,
  users,
  centered,
}: {
  role: RoleRow;
  users: number;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border bg-white p-4 shadow-sm shadow-indigo-100/60",
        role.role_type === "system" ? "border-[#4F46E5]/35" : "border-emerald-200",
        centered && "mx-auto max-w-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <IconBox icon={ShieldCheck} color={role.color} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-[#111827]">{role.name}</h3>
            <StatusBadge tone={role.role_type === "system" ? "default" : "success"}>
              {formatLabel(role.role_type)}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {role.description ?? "No description"}
          </p>
          <p className="mt-2 text-xs font-black text-slate-500">{users} users</p>
        </div>
      </div>
    </div>
  );
}

function AccessBadge({ access }: { access: string }) {
  const tone =
    access === "full_access"
      ? "success"
      : access === "edit"
        ? "warning"
        : access === "no_access"
          ? "danger"
          : "default";
  return <StatusBadge tone={tone}>{formatLabel(access)}</StatusBadge>;
}

function StatusBadge({
  children,
  tone = "default",
  compact = false,
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  compact?: boolean;
}) {
  const className = {
    default: "bg-[#F1ECFF] text-[#4F46E5]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];

  return (
    <Badge
      className={cn(
        "border-0 font-black",
        compact ? "rounded-md px-2 py-0.5 text-[11px]" : "",
        className
      )}
      variant="secondary"
    >
      {children}
    </Badge>
  );
}

function PanelMessage({ state }: { state: ActionState }) {
  if (!state) return null;

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-bold",
        state.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {state.message}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className="text-lg font-black text-[#111827]">{value}</span>
    </div>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-1.5 w-8 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function teamValuesFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: stringOrNull(formData.get("description")),
    department: stringOrNull(formData.get("department")),
    team_lead_id: stringOrNull(formData.get("team_lead_id")),
    color: String(formData.get("color") || "#4F46E5"),
    icon: "users",
    is_active: true,
  };
}

function teamMemberValuesFromForm(formData: FormData) {
  return {
    profile_id: String(formData.get("profile_id") ?? ""),
    team_id: String(formData.get("team_id") ?? ""),
    team_role: String(formData.get("team_role") || "member"),
  };
}

function roleValuesFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: stringOrNull(formData.get("description")),
    parent_role_id: stringOrNull(formData.get("parent_role_id")),
    role_level: Number(formData.get("role_level") || 50),
    icon: "shield",
    color: String(formData.get("color") || "#4F46E5"),
    is_active: true,
  };
}

function permissionSetValuesFromForm(
  formData: FormData,
  existingRules: PermissionRuleRow[] = []
) {
  const copiedPermissionSetId = stringOrNull(formData.get("copy_from_permission_set_id"));
  const copiedRules = copiedPermissionSetId
    ? existingRules
        .filter((rule) => rule.permission_set_id === copiedPermissionSetId)
        .filter((rule) =>
          crmModuleNames.includes(rule.module_name as (typeof crmModuleNames)[number])
        )
        .filter((rule) =>
          crmAccessLevels.includes(rule.access_level as (typeof crmAccessLevels)[number])
        )
        .map((rule) => ({
          module_name: rule.module_name as (typeof crmModuleNames)[number],
          access_level: rule.access_level as (typeof crmAccessLevels)[number],
        }))
    : [];
  const selectedRules = permissionSetModalModules
    .map((moduleName) => {
      const accessLevel = String(formData.get(`permission-${moduleName}`) ?? "");

      if (!crmAccessLevels.includes(accessLevel as (typeof crmAccessLevels)[number])) {
        return null;
      }

      return {
        module_name: moduleName,
        access_level: accessLevel as (typeof crmAccessLevels)[number],
      };
    })
    .filter((rule): rule is NonNullable<typeof rule> => rule !== null);

  return {
    name: String(formData.get("name") ?? ""),
    description: stringOrNull(formData.get("description")),
    icon: "shield",
    color: String(formData.get("color") || "#4F46E5"),
    is_active: true,
    rules: selectedRules.length > 0 ? selectedRules : copiedRules,
  };
}

function inviteValuesFromForm(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    department: stringOrNull(formData.get("department")),
    job_title: stringOrNull(formData.get("job_title")),
    role_id: stringOrNull(formData.get("role_id")),
    team_id: stringOrNull(formData.get("team_id")),
    delivery_method: String(formData.get("delivery_method") || "email"),
    expires_in_days: 7,
  };
}

function getTeamSummary(
  profiles: ProfileRow[],
  teams: TeamRow[],
  teamMembers: TeamMemberRow[]
) {
  const colors = ["#4F46E5", "#1D8BFF", "#12B981", "#F59E0B", "#F97316", "#7C89A8"];
  const counts = new Map<string, number>();

  teams.forEach((team) => counts.set(team.name, 0));
  teamMembers.forEach((member) => {
    const team = teams.find((item) => item.id === member.team_id);
    if (team) counts.set(team.name, (counts.get(team.name) ?? 0) + 1);
  });
  profiles.forEach((profile) => {
    if (!teamMembers.some((member) => member.profile_id === profile.id)) {
      const department = formatLabel(profile.department ?? "others");
      counts.set(department, (counts.get(department) ?? 0) + 1);
    }
  });

  const sorted = Array.from(counts.entries())
    .map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  const firstFive = sorted.slice(0, 5);
  const otherCount = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);

  if (firstFive.length === 0) {
    return [{ label: "Others", value: 0, color: colors[5] }];
  }

  return otherCount > 0
    ? [...firstFive, { label: "Others", value: otherCount, color: colors[5] }]
    : firstFive;
}

function teamIcon(index: number) {
  const icons = [Boxes, Crown, Shield, UserRoundCog, MailPlus, Settings];
  return icons[index % icons.length];
}

function teamTone(index: number) {
  const tones = [
    { color: "#4F46E5" },
    { color: "#10B981" },
    { color: "#3B82F6" },
    { color: "#F59E0B" },
    { color: "#EC4899" },
    { color: "#14B8A6" },
  ];

  return tones[index % tones.length];
}

function roleIcon(index: number) {
  const icons = [ShieldCheck, UsersRound, Shield, UserRoundCog, Eye, Settings];
  return icons[index % icons.length];
}

function buildRoleOverviewItems(
  roles: RoleRow[],
  roleUserCount: Map<string, number>
) {
  const colors = ["#4F46E5", "#1D8BFF", "#12B981", "#F59E0B", "#8B8EA8"];
  const sortedRoles = roles
    .map((role) => ({
      label: role.name,
      value: roleUserCount.get(role.id) ?? 0,
      roleType: role.role_type,
    }))
    .sort((a, b) => b.value - a.value);
  const visibleRoles = sortedRoles.slice(0, 4).map((role, index) => ({
    label: role.label,
    value: role.value,
    color: colors[index],
  }));
  const customRoleCount = sortedRoles
    .filter((role) => role.roleType === "custom")
    .reduce((sum, role) => sum + role.value, 0);

  if (visibleRoles.length === 0) {
    return [{ label: "Custom Roles", value: 0, color: colors[4] }];
  }

  return [
    ...visibleRoles,
    {
      label: "Custom Roles",
      value: customRoleCount,
      color: colors[4],
    },
  ];
}

function permissionModuleMeta(moduleName: (typeof crmModuleNames)[number], index: number) {
  const descriptions: Partial<Record<(typeof crmModuleNames)[number], string>> = {
    dashboard: "Access and view dashboard",
    customers: "View, create, edit, and delete customers",
    leads: "Manage leads and lead activities",
    projects: "Create and manage projects",
    invoices: "Create, edit and manage invoices",
    field_jobs: "Manage field jobs and assignments",
    inventory: "Manage inventory items and stock",
    reports: "View and generate reports",
    settings: "Access system settings",
    users: "Manage users, teams and roles",
    quotations: "Create and manage quotations",
    payments: "Manage payments and receipts",
    support: "Manage support tickets",
    restocking: "Manage restocking and suppliers",
  };

  return {
    label: formatLabel(moduleName),
    description: descriptions[moduleName] ?? `Manage ${formatLabel(moduleName).toLowerCase()}`,
    icon: teamIcon(index),
    color: teamTone(index).color,
  };
}

function permissionSetVisual(index: number, color?: string | null) {
  const icons = [Crown, UsersRound, Shield, MailPlus, Boxes, Settings, Eye, ShieldCheck];
  const tone = teamTone(index);

  return {
    icon: icons[index % icons.length],
    color: color || tone.color,
  };
}

function permissionModulePath(moduleName: (typeof crmModuleNames)[number]) {
  const paths: Partial<Record<(typeof crmModuleNames)[number], string>> = {
    field_jobs: "/field-jobs",
    engineer_daily: "/field-jobs/daily-report",
    supplier_payables: "/suppliers/payables",
    audit_logs: "/audit-logs",
  };

  return paths[moduleName] ?? `/${moduleName.replace(/_/g, "-")}`;
}

function permissionAccessForRole(
  role: RoleRow,
  moduleName: (typeof crmModuleNames)[number],
  rolePermissions: RolePermissionRow[]
): (typeof crmAccessLevels)[number] {
  const permission = rolePermissions.find(
    (item) => item.role_id === role.id && item.module_name === moduleName
  );

  if (permission?.access_level && crmAccessLevels.includes(permission.access_level as any)) {
    return permission.access_level as (typeof crmAccessLevels)[number];
  }

  return role.slug === "administrator" ? "full_access" : "not_applicable";
}

function customRolesWithPermission(
  roles: RoleRow[],
  rolePermissions: RolePermissionRow[],
  moduleName: (typeof crmModuleNames)[number]
) {
  return roles.filter((role) => {
    if (role.role_type !== "custom") return false;
    const access = permissionAccessForRole(role, moduleName, rolePermissions);
    return access !== "not_applicable" && access !== "no_access";
  }).length;
}

function buildPermissionSummary(
  modules: readonly (typeof crmModuleNames)[number][],
  roles: RoleRow[],
  rolePermissions: RolePermissionRow[]
) {
  const counts: Record<(typeof crmAccessLevels)[number], number> = {
    full_access: 0,
    edit: 0,
    view_only: 0,
    no_access: 0,
    not_applicable: 0,
  };

  modules.forEach((moduleName) => {
    roles.forEach((role) => {
      counts[permissionAccessForRole(role, moduleName, rolePermissions)] += 1;
    });
  });

  return [
    { label: "Full Access", value: counts.full_access, color: "#12B981" },
    { label: "Edit", value: counts.edit, color: "#F59E0B" },
    { label: "View Only", value: counts.view_only, color: "#1D8BFF" },
    { label: "No Access", value: counts.no_access, color: "#F43F5E" },
    { label: "Not Applicable", value: counts.not_applicable, color: "#8B8EA8" },
  ];
}

function buildModulePermissionSummary(
  moduleName: (typeof crmModuleNames)[number],
  roles: RoleRow[],
  rolePermissions: RolePermissionRow[]
) {
  return buildPermissionSummary([moduleName], roles, rolePermissions);
}

function permissionAccessForSetModule(
  permissionSetId: string,
  moduleName: (typeof crmModuleNames)[number],
  permissionSetRules: PermissionRuleRow[]
): (typeof crmAccessLevels)[number] {
  const rule = permissionSetRules.find(
    (item) =>
      item.permission_set_id === permissionSetId && item.module_name === moduleName
  );

  if (rule?.access_level && crmAccessLevels.includes(rule.access_level as any)) {
    return rule.access_level as (typeof crmAccessLevels)[number];
  }

  return "not_applicable";
}

function buildPermissionSetSummary(
  permissionSetId: string,
  permissionSetRules: PermissionRuleRow[]
) {
  const counts: Record<(typeof crmAccessLevels)[number], number> = {
    full_access: 0,
    edit: 0,
    view_only: 0,
    no_access: 0,
    not_applicable: 0,
  };

  permissionSetDetailModules.forEach((moduleName) => {
    counts[permissionAccessForSetModule(permissionSetId, moduleName, permissionSetRules)] += 1;
  });

  return permissionAccessLegend.map((item) => ({
    label: item.label,
    value: counts[item.access],
    color: item.color,
  }));
}

function permissionAccessColor(access: (typeof crmAccessLevels)[number]) {
  return permissionAccessLegend.find((item) => item.access === access)?.color ?? "#8B8EA8";
}

function getPopularRoles(
  roles: RoleRow[],
  profileRoles: ProfileRoleRow[],
  profiles: ProfileRow[]
) {
  const counts = new Map<string, number>();

  roles.forEach((role) => counts.set(role.name, 0));
  profileRoles.forEach((profileRole) => {
    const role = roles.find((item) => item.id === profileRole.role_id);
    if (role) counts.set(role.name, (counts.get(role.name) ?? 0) + 1);
  });
  profiles.forEach((profile) => {
    if (!profileRoles.some((profileRole) => profileRole.profile_id === profile.id)) {
      const label = formatLabel(profile.role);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function securityEventBelongsToPermissionSet(
  event: SecurityEventRow,
  permissionSetId: string
) {
  const metadata = asRecord(event.metadata);

  if (!metadata) {
    return false;
  }

  return metadata.permission_set_id === permissionSetId;
}

function permissionActivityDetail(event: SecurityEventRow) {
  const metadata = asRecord(event.metadata);
  const moduleName = readableValue(metadata?.module_name);
  const roleName = readableValue(metadata?.role_name);
  const permissionSetName = readableValue(metadata?.permission_set_name);
  const previousAccess = readableValue(metadata?.previous_access_level);
  const nextAccess = readableValue(metadata?.new_access_level);

  if (event.event_type === "permission_set_created") {
    return {
      actionKey: "created",
      actionLabel: "Created",
      moduleDetail: permissionSetName || "Permission Set",
      changeText: "Permission set created",
      icon: Plus,
      color: "#10B981",
    };
  }

  if (event.event_type === "role_permission_updated") {
    return {
      actionKey: "assigned",
      actionLabel: "Assigned",
      moduleDetail: roleName ? `Role: ${roleName}` : "Role assignment",
      changeText:
        previousAccess && nextAccess
          ? `Access level changed from ${formatPermissionAccessLabel(previousAccess)} to ${formatPermissionAccessLabel(nextAccess)}`
          : "Role assigned to this permission set",
      icon: UsersRound,
      color: "#F97316",
    };
  }

  return {
    actionKey: "updated",
    actionLabel: "Updated",
    moduleDetail: moduleName || permissionSetName || "Permission Set",
    changeText:
      previousAccess && nextAccess
        ? `Access level changed from ${formatPermissionAccessLabel(previousAccess)} to ${formatPermissionAccessLabel(nextAccess)}`
        : "Permission set settings updated",
    icon: Pencil,
    color: "#10B981",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readableValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function formatPermissionAccessLabel(value: string) {
  const access = crmAccessLevels.find((item) => item === value);
  if (!access) return formatLabel(value);

  return permissionAccessLegend.find((item) => item.access === access)?.label ?? formatLabel(value);
}

function formatTimeOnly(value: string | null) {
  if (!value) return "-";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "-";

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRelativeActivity(value: string | null) {
  if (!value) return "No activity";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "No activity";

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string | null) {
  if (!value) return "-";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function stringOrNull(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : null;
}

function displayName(profile: ProfileRow) {
  return (
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Unnamed User"
  );
}

function getActiveDepartments(profiles: ProfileRow[], teams: TeamRow[]) {
  const usedDepartments = new Set<string>();

  profiles.forEach((profile) => {
    if (profile.department) {
      usedDepartments.add(profile.department);
    }
  });

  teams.forEach((team) => {
    if (team.department) {
      usedDepartments.add(team.department);
    }
  });

  return teamDepartments.filter((department) => usedDepartments.has(department));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const selectClassName =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#111827] shadow-sm shadow-indigo-100/40 outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15";
