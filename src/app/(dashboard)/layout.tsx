import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { MobileBottomNav } from "@/components/shared/mobile-sidebar";
import { ThemeController } from "@/components/shared/theme-toggle";
import { requireProfile } from "@/lib/auth/require-profile";
import {
  getCurrentUserPreferences,
  getPreferenceCssVariables,
  getPreferenceUiAttributes,
} from "@/lib/preferences/user-preferences";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const preferences = await getCurrentUserPreferences(profile.id);
  const preferenceAttributes = getPreferenceUiAttributes(preferences);
  const preferenceStyle = getPreferenceCssVariables(preferences);

  return (
    <div
      className="h-screen overflow-hidden bg-white text-[#111827]"
      style={preferenceStyle}
      {...preferenceAttributes}
    >
      <Header
        profileId={profile.id}
        fullName={profile.full_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        department={profile.department}
        role={profile.role}
        allowedModules={profile.allowed_modules}
        keyboardShortcutsEnabled={preferences.keyboard_shortcuts_enabled}
      />

      <div className="flex h-full min-h-0 pt-16">
        <div className="hidden h-full min-h-0 lg:block lg:shrink-0">
          <Sidebar
            profileId={profile.id}
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            role={profile.role}
            allowedModules={profile.allowed_modules}
          />
        </div>

        <main className="h-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white px-3 pb-24 pt-0 sm:px-5 lg:px-0 lg:pb-7">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>

      <MobileBottomNav
        role={profile.role}
        allowedModules={profile.allowed_modules}
      />
      <ThemeController />
    </div>
  );
}
