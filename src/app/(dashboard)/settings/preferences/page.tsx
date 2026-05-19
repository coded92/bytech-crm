import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { PreferencesForm } from "@/components/settings/preferences-form";
import {
  SettingsMetric,
  SettingsRailCard,
  SettingsSection,
  SettingsWorkspace,
  StatusPill,
} from "@/components/settings/settings-workspace";

type UserPreferenceRow = {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  compact_mode: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
};

const defaultPreferences: UserPreferenceRow = {
  theme: "light",
  language: "en",
  timezone: "UTC",
  compact_mode: false,
  email_notifications: true,
  push_notifications: true,
};

export default async function SettingsPreferencesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("user_preferences")
    .select(
      "theme, language, timezone, compact_mode, email_notifications, push_notifications"
    )
    .eq("user_id", profile.id)
    .maybeSingle();

  const preferences = ((data as UserPreferenceRow | null) ??
    defaultPreferences) as UserPreferenceRow;

  return (
    <SettingsWorkspace
      active="preferences"
      title="Preferences"
      description="Control real saved workspace preferences for your own BYTECH CRM account."
      isAdmin={profile.role === "admin"}
      rightRail={
        <>
          <SettingsRailCard title="Current Preference State">
            <div className="space-y-3">
              <SettingsMetric label="Theme" value={preferences.theme} />
              <SettingsMetric label="Language" value={preferences.language} />
              <SettingsMetric
                label="Compact Mode"
                value={preferences.compact_mode ? "On" : "Off"}
                tone={preferences.compact_mode ? "success" : "default"}
              />
            </div>
          </SettingsRailCard>
          <SettingsRailCard title="Scope">
            <p className="text-sm leading-6 text-slate-500">
              These settings are stored in `user_preferences`. They are safe for
              self-service and do not change role, department, or module access.
            </p>
          </SettingsRailCard>
        </>
      }
    >
      <SettingsSection
        title="Workspace Preferences"
        description="Saved preferences are available to future dashboard, profile, and settings UI."
      >
        <div className="mb-4">
          <StatusPill tone="success">Fully operational</StatusPill>
        </div>
        <PreferencesForm preferences={preferences} />
      </SettingsSection>
    </SettingsWorkspace>
  );
}
