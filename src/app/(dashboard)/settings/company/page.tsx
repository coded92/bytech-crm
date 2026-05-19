import {
  Calendar,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  ListChecks,
  MousePointerClick,
} from "lucide-react";
import { getGeneralSettingsData } from "@/lib/actions/general-settings";
import {
  GeneralSettingsForm,
  GeneralSettingsResetButton,
} from "@/components/settings/general-settings-form";
import {
  SettingsRailCard,
  SettingsWorkspace,
} from "@/components/settings/settings-workspace";

export default async function CompanySettingsPage() {
  const settings = await getGeneralSettingsData();

  return (
    <SettingsWorkspace
      active="general"
      title="General"
      description="Manage your account's basic information and general settings."
      eyebrow=""
      isAdmin={settings.access.canManageOrganization}
      headerAction={<GeneralSettingsResetButton />}
      rightRail={
        <>
          <SettingsRailCard title="About General Settings">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                These settings control the basic information and defaults for
                your account. Changes will be applied across the platform.
              </p>
              <a
                href="/settings/data-privacy"
                className="inline-flex items-center gap-2 text-sm font-black text-[#4F46E5]"
              >
                Learn more about general settings
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Current Settings Summary">
            <div className="space-y-4">
              <SummaryItem
                icon={LayoutDashboard}
                label="Landing Page"
                value={formatSummaryValue(settings.summary.landing_page)}
              />
              <SummaryItem
                icon={Clock3}
                label="Time Format"
                value={settings.summary.time_format}
              />
              <SummaryItem
                icon={Calendar}
                label="Date Format"
                value={settings.summary.date_format}
              />
              <SummaryItem
                icon={FileText}
                label="Start of Week"
                value={formatSummaryValue(settings.summary.start_of_week)}
              />
              <SummaryItem
                icon={ListChecks}
                label="Items per page"
                value={String(settings.summary.items_per_page)}
              />
              <SummaryItem
                icon={LayoutDashboard}
                label="Default View"
                value={formatSummaryValue(settings.summary.default_view)}
              />
              <SummaryItem
                icon={MousePointerClick}
                label="Inline Editing"
                value={formatSummaryValue(settings.summary.inline_editing_status)}
              />
            </div>
          </SettingsRailCard>

          <SettingsRailCard title="Need Help?">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-7 text-slate-600">
                If you have questions about general settings, our support team
                is here to help.
              </p>
              <a
                href="/support"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#4F46E5]/30 bg-white px-4 text-sm font-black text-[#4F46E5] shadow-sm transition hover:bg-[#F1F0FC]"
              >
                <CircleHelp className="size-4" />
                Visit Help Center
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </SettingsRailCard>
        </>
      }
    >
      <GeneralSettingsForm
        organization={settings.organization}
        preferences={settings.preferences}
        canManageOrganization={settings.access.canManageOrganization}
      />
    </SettingsWorkspace>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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
      <span className="shrink-0 text-sm font-bold text-[#172554]">{value}</span>
    </div>
  );
}

function formatSummaryValue(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
