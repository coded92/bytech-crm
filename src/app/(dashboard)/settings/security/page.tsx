import { getMySecurityWorkspaceData } from "@/lib/actions/security";
import { requireProfile } from "@/lib/auth/require-profile";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";
import { SecuritySettingsPanel } from "@/components/settings/security-settings-panel";
import { SecurityOverviewButton } from "@/components/settings/security-overview-button";

export default async function SettingsSecurityPage() {
  const profile = await requireProfile();
  const data = await getMySecurityWorkspaceData();
  const hasBackendError = Object.values(data.errors).some(Boolean);

  return (
    <SettingsWorkspace
      active="security"
      title="Security"
      description="Manage your account security, authentication, and access controls."
      eyebrow=""
      isAdmin={profile.role === "admin"}
      headerAction={
        <SecurityOverviewButton
          overview={data.overview}
          activeSessions={data.activeSessions}
          securityEvents={data.securityEvents}
        />
      }
    >
      {hasBackendError ? (
        <div className="mb-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Some security backend reads failed. The page is still rendering the
          available real data.
        </div>
      ) : null}

      <SecuritySettingsPanel
        settings={data.settings}
        twoFactor={data.twoFactor}
        recoveryContacts={data.recoveryContacts}
        securityQuestions={data.securityQuestions}
        activeSessions={data.activeSessions}
        currentSessionIdentifier={data.currentSessionIdentifier}
        securityEvents={data.securityEvents}
      />
    </SettingsWorkspace>
  );
}
