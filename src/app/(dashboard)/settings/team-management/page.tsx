import Link from "next/link";
import {
  Bell,
  CircleHelp,
  ExternalLink,
  GitBranch,
  KeyRound,
  Link2,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTeamManagementSettingsData } from "@/lib/actions/team-settings";
import {
  TeamManagementSettingsForm,
  TeamManagementSettingsResetButton,
} from "@/components/settings/team-management-settings-form";
import {
  SettingsRailCard,
  SettingsWorkspace,
} from "@/components/settings/settings-workspace";

export default async function TeamManagementSettingsPage() {
  await requireAdmin();

  const data = await getTeamManagementSettingsData();

  if ("error" in data) {
    return (
      <SettingsWorkspace
        active="team"
        title="Team Management"
        description="Configure team-related settings, permissions, and workflows."
        eyebrow=""
        isAdmin
      >
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {data.error}
        </div>
      </SettingsWorkspace>
    );
  }

  const { settings, roles, options, limitations } = data;

  return (
    <SettingsWorkspace
      active="team"
      title="Team Management"
      description="Configure team-related settings, permissions, and workflows to streamline your operations."
      eyebrow=""
      isAdmin
      headerAction={<TeamManagementSettingsResetButton />}
      rightRail={
        <>
          <SettingsRailCard title="About Team Management">
            <p className="text-sm font-medium leading-7 text-slate-600">
              These settings help you configure how your team operates, manages
              access, and collaborates within BYTECH CRM.
            </p>
            <p className="mt-4 text-sm font-black text-[#4F46E5]">
              Changes are stored in real backend settings and can be wired into
              workflows module by module.
            </p>
          </SettingsRailCard>

          <SettingsRailCard title="Quick Actions">
            <div className="space-y-3">
              <RailAction
                icon={UsersRound}
                label="Invite Member"
                description="Manage real invitations"
                href="/team-management?tab=members"
              />
              <RailAction
                icon={KeyRound}
                label="Manage Roles"
                description="Create and manage roles"
                href="/team-management?tab=roles"
              />
              <RailAction
                icon={GitBranch}
                label="Manage Departments"
                description="Organize teams by department"
                href="/team-management?tab=departments"
              />
              <RailAction
                icon={ShieldCheck}
                label="Permission Matrix"
                description="Review module access"
                href="/team-management?tab=permissions"
              />
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Backend Coverage">
            <div className="space-y-4">
              <CoverageLine
                icon={ShieldCheck}
                label="Access Rules"
                value="Stored"
              />
              <CoverageLine icon={Bell} label="Team Alerts" value="Stored" />
              <CoverageLine
                icon={SlidersHorizontal}
                label="Display Defaults"
                value="Stored"
              />
              <CoverageLine
                icon={Link2}
                label="Integrations"
                value="Status only"
              />
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Need help?">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                Integration, approval workflow, and email delivery settings are
                backend-ready but only become active when their modules consume
                the saved values.
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
      <TeamManagementSettingsForm
        settings={settings}
        roles={roles}
        options={options}
        limitations={limitations}
      />
    </SettingsWorkspace>
  );
}

function RailAction({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-transparent p-2 transition hover:border-indigo-100 hover:bg-[#F8F7FF]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-[#111827] group-hover:text-[#4F46E5]">
          {label}
        </span>
        <span className="block truncate text-xs font-medium text-slate-500">
          {description}
        </span>
      </span>
    </Link>
  );
}

function CoverageLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
          <Icon className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold text-slate-600">
          {label}
        </span>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
        {value}
      </span>
    </div>
  );
}
