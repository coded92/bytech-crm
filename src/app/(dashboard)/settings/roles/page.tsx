import Link from "next/link";
import {
  CircleHelp,
  ExternalLink,
  KeyRound,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTeamManagementData } from "@/lib/actions/team-management";
import {
  TeamManagementPanel,
  type TeamManagementData,
} from "@/components/settings/team-management-panel";
import {
  SettingsRailCard,
  SettingsWorkspace,
} from "@/components/settings/settings-workspace";
import { Button } from "@/components/ui/button";

export default async function RolesSettingsPage() {
  await requireAdmin();

  const data = await getTeamManagementData();

  if ("error" in data) {
    return (
      <SettingsWorkspace
        active="roles"
        title="Role Hierarchy"
        description="Visualize your organization's role structure and reporting levels."
        eyebrow=""
        isAdmin
      >
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {data.error}
        </div>
      </SettingsWorkspace>
    );
  }

  const roleData = data as TeamManagementData;
  const systemRoles = roleData.roles.filter((role) => role.role_type === "system");
  const customRoles = roleData.roles.filter((role) => role.role_type === "custom");

  return (
    <SettingsWorkspace
      active="roles"
      title="Role Hierarchy"
      description="Visualize your organization's role structure and reporting levels."
      eyebrow=""
      isAdmin
      headerAction={
        <Button asChild variant="outline">
          <Link href="/team-management?tab=permissions">
            <KeyRound className="size-4" />
            Manage Permissions
          </Link>
        </Button>
      }
      rightRail={
        <>
          <SettingsRailCard title="About Role Hierarchy">
            <p className="text-sm font-medium leading-7 text-slate-600">
              Roles are arranged from higher to lower access levels using real
              parent role relationships. System roles are protected; custom roles
              can be added for your operating teams.
            </p>
          </SettingsRailCard>

          <SettingsRailCard title="Hierarchy Summary">
            <div className="space-y-4">
              <SummaryRow
                icon={Network}
                label="Total Roles"
                value={roleData.roles.length}
              />
              <SummaryRow
                icon={ShieldCheck}
                label="System Roles"
                value={systemRoles.length}
              />
              <SummaryRow
                icon={KeyRound}
                label="Custom Roles"
                value={customRoles.length}
              />
              <SummaryRow
                icon={UsersRound}
                label="Total Users"
                value={roleData.profiles.length}
              />
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Need Help?">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                Changes to roles and hierarchy may affect user permissions.
                Review them before assigning roles to users.
              </p>
              <Link
                href="/support"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#4F46E5]/30 bg-white px-4 text-sm font-black text-[#4F46E5] shadow-sm transition hover:bg-[#F1F0FC]"
              >
                <CircleHelp className="size-4" />
                Visit Help Center
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </SettingsRailCard>
        </>
      }
    >
      <TeamManagementPanel data={roleData} mode="roles" />
    </SettingsWorkspace>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
          <Icon className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold text-slate-600">
          {label}
        </span>
      </div>
      <span className="shrink-0 text-sm font-black text-[#111827]">
        {value}
      </span>
    </div>
  );
}
