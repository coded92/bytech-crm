import { requireProfile } from "@/lib/auth/require-profile";
import { getMySessionsDataAction } from "@/lib/actions/sessions";
import { getMySecurityWorkspaceData } from "@/lib/actions/security";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { SessionsPanel } from "@/components/settings/sessions-panel";
import { SecurityOverviewButton } from "@/components/settings/security-overview-button";

type ActiveSessionRow = {
  id: string;
  session_identifier: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  user_agent: string | null;
  status: "active" | "signed_out" | "expired" | "revoked";
  first_seen_at: string;
  last_seen_at: string;
  signed_out_at: string | null;
  revoked_at: string | null;
};

type SessionEventRow = {
  id: string;
  session_identifier: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  event_type: "login" | "logout" | "refresh";
  last_seen_at: string;
  created_at: string;
};

export default async function SettingsSessionsPage() {
  const profile = await requireProfile();
  const [sessionsData, securityData] = await Promise.all([
    getMySessionsDataAction(),
    getMySecurityWorkspaceData(),
  ]);
  const securityOverviewProps = {
    overview: securityData.overview,
    activeSessions: securityData.activeSessions,
    securityEvents: securityData.securityEvents,
  };

  return (
    <SettingsWorkspace
      active="sessions"
      title="Sessions"
      description="View and manage all the active sessions on your account."
      eyebrow=""
      isAdmin={profile.role === "admin"}
      headerAction={<SecurityOverviewButton {...securityOverviewProps} />}
    >
      <SessionsPanel
        activeSessions={(sessionsData.activeSessions ?? []) as ActiveSessionRow[]}
        sessionEvents={(sessionsData.sessionEvents ?? []) as SessionEventRow[]}
        currentSessionIdentifier={sessionsData.currentSessionIdentifier ?? null}
        error={"error" in sessionsData ? sessionsData.error : undefined}
        securityOverviewTrigger={<SecurityOverviewButton compact {...securityOverviewProps} />}
      />
    </SettingsWorkspace>
  );
}
