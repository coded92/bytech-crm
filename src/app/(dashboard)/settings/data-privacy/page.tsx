import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import {
  SettingsMetric,
  SettingsRailCard,
  SettingsSection,
  SettingsWorkspace,
  StatusPill,
} from "@/components/settings/settings-workspace";

export default async function SettingsDataPrivacyPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    { count: notificationCount },
    { count: securityEventCount },
    { count: sessionEventCount },
  ] = await Promise.all([
    (supabase as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    (supabase as any)
      .from("user_security_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    (supabase as any)
      .from("user_session_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  return (
    <SettingsWorkspace
      active="privacy"
      title="Data & Privacy"
      description="A truthful overview of currently stored account data and the privacy workflows that still need backend implementation."
      isAdmin={profile.role === "admin"}
      rightRail={
        <>
          <SettingsRailCard title="Your Data Footprint">
            <div className="space-y-3">
              <SettingsMetric
                label="Notifications"
                value={String(notificationCount ?? 0)}
              />
              <SettingsMetric
                label="Security Events"
                value={String(securityEventCount ?? 0)}
              />
              <SettingsMetric
                label="Session Events"
                value={String(sessionEventCount ?? 0)}
              />
            </div>
          </SettingsRailCard>
          <SettingsRailCard title="Execution Status">
            <p className="text-sm leading-6 text-slate-500">
              Export execution, deletion requests, and consent workflows are not
              implemented yet, so this page intentionally stays read-only.
            </p>
          </SettingsRailCard>
        </>
      }
    >
      <div className="space-y-5">
        <SettingsSection
          title="Currently Supported Data Areas"
          description="These records are backed by existing CRM tables and security policies."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <PrivacyItem label="Profile record" detail="profiles" ready />
            <PrivacyItem label="Workspace preferences" detail="user_preferences" ready />
            <PrivacyItem label="Notification preferences" detail="notification_preferences" ready />
            <PrivacyItem label="Security events" detail="user_security_events" ready />
            <PrivacyItem label="Session activity events" detail="user_session_events" ready />
            <PrivacyItem label="In-app notifications" detail="notifications" ready />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Future Privacy Workflows"
          description="These items require dedicated backend tables and approval workflows before they should become interactive."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <PrivacyItem label="Data export requests" detail="Not implemented" />
            <PrivacyItem label="Account deletion requests" detail="Not implemented" />
            <PrivacyItem label="Consent history" detail="Not implemented" />
            <PrivacyItem label="Export audit trail" detail="Not implemented" />
          </div>
        </SettingsSection>
      </div>
    </SettingsWorkspace>
  );
}

function PrivacyItem({
  label,
  detail,
  ready = false,
}: {
  label: string;
  detail: string;
  ready?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-[#F8F7FF] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#111827]">{label}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <StatusPill tone={ready ? "success" : "warning"}>
          {ready ? "Backed" : "Future"}
        </StatusPill>
      </div>
    </div>
  );
}
