import { createClient } from "@/lib/supabase/server";
import type { CSSProperties } from "react";
import type { Profile, UserPreferences } from "@/types/database";

export type LandingPagePreference = UserPreferences["default_landing_page"];
export type UserPreferenceSnapshot = Pick<
  UserPreferences,
  | "default_landing_page"
  | "items_per_page"
  | "time_format"
  | "date_format"
  | "inline_editing_enabled"
  | "start_of_week"
  | "default_view_mode"
  | "view_density"
  | "highlight_color"
  | "show_avatars"
  | "show_tooltips"
  | "auto_save_changes"
  | "show_productivity_tips"
  | "confirm_before_deleting"
  | "keyboard_shortcuts_enabled"
>;

export const defaultUserPreferences: UserPreferenceSnapshot = {
  default_landing_page: "dashboard",
  items_per_page: 25,
  time_format: "12-hour",
  date_format: "MM/DD/YYYY",
  inline_editing_enabled: true,
  start_of_week: "monday",
  default_view_mode: "comfortable",
  view_density: "comfortable",
  highlight_color: "#4F46E5",
  show_avatars: true,
  show_tooltips: true,
  auto_save_changes: true,
  show_productivity_tips: true,
  confirm_before_deleting: true,
  keyboard_shortcuts_enabled: true,
};

const preferenceSelect = `
  default_landing_page,
  items_per_page,
  time_format,
  date_format,
  inline_editing_enabled,
  start_of_week,
  default_view_mode,
  view_density,
  highlight_color,
  show_avatars,
  show_tooltips,
  auto_save_changes,
  show_productivity_tips,
  confirm_before_deleting,
  keyboard_shortcuts_enabled
`;

const landingPageRoutes: Record<LandingPagePreference, string> = {
  dashboard: "/dashboard",
  leads: "/leads",
  customers: "/customers",
  projects: "/projects",
  "field-jobs": "/field-jobs",
  support: "/support",
  inventory: "/inventory",
  payments: "/payments",
  reports: "/reports",
};

const landingPageModules: Partial<Record<LandingPagePreference, string[]>> = {
  leads: ["leads"],
  customers: ["customers"],
  projects: ["projects"],
  "field-jobs": ["field_jobs", "field-jobs"],
  support: ["support"],
  inventory: ["inventory"],
  payments: ["payments", "invoices"],
  reports: ["reports"],
};

export function mergeUserPreferences(
  preferences: Partial<UserPreferenceSnapshot> | null | undefined
): UserPreferenceSnapshot {
  return {
    ...defaultUserPreferences,
    ...Object.fromEntries(
      Object.entries(preferences ?? {}).filter(([, value]) => value != null)
    ),
  } as UserPreferenceSnapshot;
}

export async function getCurrentUserPreferences(
  userId: string
): Promise<UserPreferenceSnapshot> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("user_preferences")
    .select(preferenceSelect)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user preferences", error);
    return defaultUserPreferences;
  }

  return mergeUserPreferences(data as Partial<UserPreferenceSnapshot> | null);
}

export function getLandingPagePath(
  preferences: Pick<UserPreferenceSnapshot, "default_landing_page">,
  profile: Pick<Profile, "role" | "allowed_modules">
) {
  const landingPage = preferences.default_landing_page;
  const route = landingPageRoutes[landingPage] ?? "/dashboard";

  if (profile.role === "admin" || landingPage === "dashboard") {
    return route;
  }

  const requiredModules = landingPageModules[landingPage] ?? [];
  const hasModuleAccess = requiredModules.some((moduleName) =>
    profile.allowed_modules.includes(moduleName)
  );

  return hasModuleAccess ? route : "/dashboard";
}

export function getPreferenceUiAttributes(
  preferences: UserPreferenceSnapshot
) {
  return {
    "data-density": preferences.view_density,
    "data-view-mode": preferences.default_view_mode,
    "data-show-avatars": String(preferences.show_avatars),
    "data-show-tooltips": String(preferences.show_tooltips),
    "data-show-productivity-tips": String(preferences.show_productivity_tips),
    "data-inline-editing": String(preferences.inline_editing_enabled),
  };
}

export function getPreferenceCssVariables(
  preferences: UserPreferenceSnapshot
) {
  const accent = isValidHexColor(preferences.highlight_color)
    ? preferences.highlight_color
    : defaultUserPreferences.highlight_color;

  return {
    "--bytech-accent": accent,
    "--bytech-accent-rgb": hexToRgbTriplet(accent),
  } as CSSProperties;
}

export function getUserItemsPerPage(
  preferences: Pick<UserPreferenceSnapshot, "items_per_page"> | null | undefined
) {
  return preferences?.items_per_page ?? defaultUserPreferences.items_per_page;
}

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function hexToRgbTriplet(value: string) {
  const hex = value.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}
