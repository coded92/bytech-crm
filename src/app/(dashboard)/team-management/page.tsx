import Link from "next/link";
import { Network, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTeamManagementData } from "@/lib/actions/team-management";
import {
  TeamManagementPanel,
  type TeamManagementData,
} from "@/components/settings/team-management-panel";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams?: Promise<{
    tab?: string;
    invite?: string;
    create?: string;
    createSet?: string;
  }>;
};

const teamTabs = ["members", "departments", "roles", "permissions"] as const;

export default async function TeamManagementPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = (await searchParams) || {};
  const requestedTab = params.tab === "teams" ? "departments" : params.tab;
  const activeTab = teamTabs.includes(requestedTab as (typeof teamTabs)[number])
    ? (requestedTab as (typeof teamTabs)[number])
    : "members";
  const data = await getTeamManagementData();

  if ("error" in data) {
    return (
      <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
        {data.error}
      </div>
    );
  }

  const teamData = data as TeamManagementData;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.35rem] font-black tracking-tight text-[#111827]">
            Team Management
          </h1>
          <p className="mt-1 text-sm font-medium leading-6 text-[#34406B]">
            Manage your team members, roles, and permissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="h-11 rounded-xl border-[#B9A8FF] px-5 font-black text-[#4F46E5]">
            <Link href="/settings/roles">
              <Network className="size-4" />
              View Role Hierarchy
            </Link>
          </Button>
          <Button asChild className="h-11 rounded-xl bg-[#4F46E5] px-5 font-black shadow-lg shadow-indigo-200 hover:bg-[#4338CA]">
            <Link
              href={
                activeTab === "permissions"
                  ? "/team-management?tab=permissions&createSet=true"
                  : activeTab === "roles"
                  ? "/team-management?tab=roles&create=true"
                  : "/team-management?tab=members&invite=true"
              }
            >
              <Plus className="size-4" />
              {activeTab === "permissions"
                ? "Add Permission Set"
                : activeTab === "roles"
                  ? "Create Role"
                  : "Invite Member"}
            </Link>
          </Button>
        </div>
      </section>

      <TeamManagementPanel
        data={teamData}
        mode="team"
        activeTab={activeTab}
        basePath="/team-management"
        initialInviteOpen={params.invite === "true"}
        initialRoleCreateOpen={params.create === "true"}
        initialPermissionSetCreateOpen={params.createSet === "true"}
      />
    </div>
  );
}
