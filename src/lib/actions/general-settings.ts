"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireProfile } from "@/lib/auth/require-profile";
import { getCompanySettings } from "@/lib/company/get-company-settings";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/events";
import { updateOrganizationInfoSchema } from "@/lib/validations/company-settings";
import { generalSettingsPreferencesSchema } from "@/lib/validations/profile";
import type { UserPreferences } from "@/types/database";

type ActionResponse = { success: true } | { error: string };

type CompanySettingsRecord = {
  id: string;
  company_name: string;
  brand_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  logo_url: string | null;
  currency_symbol: string;
  document_footer: string | null;
};

const defaultGeneralPreferences = {
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
} as const;

function formBoolean(formData: FormData, key: string, fallback = false) {
  const value = formData.get(key);
  if (value === null) return fallback;
  return value === "on" || value === "true" || value === "1";
}

function optionalFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mergeGeneralPreferences(preferences: Partial<UserPreferences> | null) {
  return {
    ...defaultGeneralPreferences,
    default_landing_page:
      preferences?.default_landing_page ??
      defaultGeneralPreferences.default_landing_page,
    items_per_page:
      preferences?.items_per_page ?? defaultGeneralPreferences.items_per_page,
    time_format: preferences?.time_format ?? defaultGeneralPreferences.time_format,
    date_format: preferences?.date_format ?? defaultGeneralPreferences.date_format,
    inline_editing_enabled:
      preferences?.inline_editing_enabled ??
      defaultGeneralPreferences.inline_editing_enabled,
    start_of_week:
      preferences?.start_of_week ?? defaultGeneralPreferences.start_of_week,
    default_view_mode:
      preferences?.default_view_mode ??
      defaultGeneralPreferences.default_view_mode,
    view_density:
      preferences?.view_density ?? defaultGeneralPreferences.view_density,
    highlight_color:
      preferences?.highlight_color ?? defaultGeneralPreferences.highlight_color,
    show_avatars:
      preferences?.show_avatars ?? defaultGeneralPreferences.show_avatars,
    show_tooltips:
      preferences?.show_tooltips ?? defaultGeneralPreferences.show_tooltips,
    auto_save_changes:
      preferences?.auto_save_changes ??
      defaultGeneralPreferences.auto_save_changes,
    show_productivity_tips:
      preferences?.show_productivity_tips ??
      defaultGeneralPreferences.show_productivity_tips,
    confirm_before_deleting:
      preferences?.confirm_before_deleting ??
      defaultGeneralPreferences.confirm_before_deleting,
    keyboard_shortcuts_enabled:
      preferences?.keyboard_shortcuts_enabled ??
      defaultGeneralPreferences.keyboard_shortcuts_enabled,
  };
}

export async function getGeneralSettingsData() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [companySettings, preferencesResult] = await Promise.all([
    getCompanySettings(),
    (supabase as any)
      .from("user_preferences")
      .select(
        `
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
        `
      )
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);

  const preferences = mergeGeneralPreferences(
    preferencesResult.data as Partial<UserPreferences> | null
  );

  return {
    organization: {
      company_name: companySettings.company_name,
      email: companySettings.email,
      phone: companySettings.phone,
      website: companySettings.website,
      address: companySettings.address,
    },
    preferences,
    summary: {
      landing_page: preferences.default_landing_page,
      time_format: preferences.time_format,
      date_format: preferences.date_format,
      start_of_week: preferences.start_of_week,
      items_per_page: preferences.items_per_page,
      default_view: preferences.default_view_mode,
      inline_editing_status: preferences.inline_editing_enabled
        ? "enabled"
        : "disabled",
    },
    access: {
      canManageOrganization: profile.role === "admin",
    },
  };
}

export async function updateOrganizationInfoAction(
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const parsed = updateOrganizationInfoSchema.safeParse({
    company_name: formData.get("company_name"),
    email: optionalFormText(formData, "email"),
    phone: optionalFormText(formData, "phone"),
    website: optionalFormText(formData, "website"),
    address: optionalFormText(formData, "address"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid organization data",
    };
  }

  const { data: existingData } = await (supabase as any)
    .from("company_settings")
    .select(
      `
        id,
        company_name,
        brand_name,
        email,
        phone,
        website,
        address,
        city,
        state,
        country,
        logo_url,
        currency_symbol,
        document_footer
      `
    )
    .limit(1)
    .maybeSingle();

  const existing = existingData as CompanySettingsRecord | null;
  const payload = {
    company_name: parsed.data.company_name,
    brand_name: existing?.brand_name ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    website: parsed.data.website ?? null,
    address: parsed.data.address ?? null,
    city: existing?.city ?? null,
    state: existing?.state ?? null,
    country: existing?.country ?? null,
    logo_url: existing?.logo_url ?? null,
    currency_symbol: existing?.currency_symbol ?? "₦",
    document_footer: existing?.document_footer ?? null,
  };

  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("company_settings")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await (supabase as any)
      .from("company_settings")
      .insert(payload);

    if (error) {
      return { error: error.message };
    }
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: admin.id,
    entity_type: "company_settings",
    entity_id: existing?.id || admin.id,
    action: "organization_info_updated",
    description: "Updated organization information for general settings",
  });

  await logSecurityEvent({
    userId: admin.id,
    eventType: "company_settings_updated",
    metadata: {
      scope: "organization_information",
      company_name: parsed.data.company_name,
    },
  });

  revalidatePath("/settings/company");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/quotations");
  revalidatePath("/payments/invoices");
  revalidatePath("/payments/receipts");

  return { success: true };
}

export async function updateGeneralPreferencesAction(
  formData: FormData
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsed = generalSettingsPreferencesSchema.safeParse({
    default_landing_page: formData.get("default_landing_page") || "dashboard",
    items_per_page: formData.get("items_per_page") || "25",
    time_format: formData.get("time_format") || "12-hour",
    date_format: formData.get("date_format") || "MM/DD/YYYY",
    inline_editing_enabled: formBoolean(
      formData,
      "inline_editing_enabled",
      true
    ),
    start_of_week: formData.get("start_of_week") || "monday",
    default_view_mode: formData.get("default_view_mode") || "comfortable",
    view_density: formData.get("view_density") || "comfortable",
    highlight_color: formData.get("highlight_color") || "#4F46E5",
    show_avatars: formBoolean(formData, "show_avatars", true),
    show_tooltips: formBoolean(formData, "show_tooltips", true),
    auto_save_changes: formBoolean(formData, "auto_save_changes", true),
    show_productivity_tips: formBoolean(
      formData,
      "show_productivity_tips",
      true
    ),
    confirm_before_deleting: formBoolean(
      formData,
      "confirm_before_deleting",
      true
    ),
    keyboard_shortcuts_enabled: formBoolean(
      formData,
      "keyboard_shortcuts_enabled",
      true
    ),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid general settings",
    };
  }

  const { error } = await (supabase as any).from("user_preferences").upsert({
    user_id: profile.id,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "user",
    entity_id: profile.id,
    action: "general_settings_updated",
    description: "Updated personal general settings",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "general_settings_updated",
    metadata: {
      default_landing_page: parsed.data.default_landing_page,
      items_per_page: parsed.data.items_per_page,
      time_format: parsed.data.time_format,
      date_format: parsed.data.date_format,
      start_of_week: parsed.data.start_of_week,
      default_view_mode: parsed.data.default_view_mode,
      inline_editing_enabled: parsed.data.inline_editing_enabled,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/preferences");
  revalidatePath("/settings/company");
  revalidatePath("/dashboard");
  revalidatePath(`/users/${profile.id}`);

  return { success: true };
}
