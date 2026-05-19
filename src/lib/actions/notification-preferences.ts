"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { logSecurityEvent } from "@/lib/security/events";
import {
  notificationPhoneNumberSchema,
  type NotificationChannelSettingsValues,
  type NotificationPhoneNumberValues,
  type NotificationPreferenceValues,
  updateNotificationChannelSettingsSchema,
  updateNotificationPreferencesSchema,
} from "@/lib/validations/profile";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function getUserNotificationPreferences() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_preferences")
    .select(
      "id, user_id, channel, event_type, enabled, digest_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, created_at, updated_at"
    )
    .eq("user_id", profile.id)
    .order("channel", { ascending: true })
    .order("event_type", { ascending: true });

  if (error) {
    return { error: error.message, preferences: [] };
  }

  return { preferences: data ?? [] };
}

export async function updateUserNotificationPreferences(
  preferences: NotificationPreferenceValues[]
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = updateNotificationPreferencesSchema.safeParse(preferences);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid notification preference data",
    };
  }

  const rows = parsed.data.map((preference) => ({
    user_id: profile.id,
    channel: preference.channel,
    event_type: preference.event_type,
    enabled: preference.enabled,
    digest_frequency: preference.digest_frequency ?? null,
    quiet_hours_enabled: preference.quiet_hours_enabled,
    quiet_hours_start: preference.quiet_hours_start ?? null,
    quiet_hours_end: preference.quiet_hours_end ?? null,
  }));

  const { error } = await (supabase as any)
    .from("notification_preferences")
    .upsert(rows, {
      onConflict: "user_id,channel,event_type",
    });

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "notification_preferences_updated",
    metadata: {
      preference_count: rows.length,
      channels: Array.from(new Set(rows.map((row) => row.channel))),
    },
  });

  revalidatePath(`/users/${profile.id}`);
  revalidatePath("/notifications");

  return { success: true };
}

export async function getUserNotificationChannelSettings() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_channel_settings")
    .select(
      "user_id, channel, email_frequency, email_format, digest_summary_enabled, include_read_items, browser_notifications_enabled, play_sound, show_unread_count, sms_delivery_priority, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, created_at, updated_at"
    )
    .eq("user_id", profile.id)
    .order("channel", { ascending: true });

  if (error) {
    return { error: error.message, settings: [] };
  }

  return { settings: data ?? [] };
}

export async function updateUserNotificationChannelSettings(
  settings: NotificationChannelSettingsValues[]
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = updateNotificationChannelSettingsSchema.safeParse(settings);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid notification channel settings",
    };
  }

  const rows = parsed.data.map((setting) => ({
    user_id: profile.id,
    channel: setting.channel,
    email_frequency: setting.email_frequency ?? null,
    email_format: setting.email_format ?? null,
    digest_summary_enabled: setting.digest_summary_enabled,
    include_read_items: setting.include_read_items,
    browser_notifications_enabled: setting.browser_notifications_enabled,
    play_sound: setting.play_sound,
    show_unread_count: setting.show_unread_count,
    sms_delivery_priority: setting.sms_delivery_priority ?? null,
    quiet_hours_enabled: setting.quiet_hours_enabled,
    quiet_hours_start: setting.quiet_hours_start ?? null,
    quiet_hours_end: setting.quiet_hours_end ?? null,
    timezone: setting.timezone ?? null,
  }));

  const { error } = await (supabase as any)
    .from("notification_channel_settings")
    .upsert(rows, {
      onConflict: "user_id,channel",
    });

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "notification_preferences_updated",
    metadata: {
      setting_count: rows.length,
      channels: Array.from(new Set(rows.map((row) => row.channel))),
    },
  });

  revalidatePath("/settings/notifications");

  return { success: true };
}

export async function getUserNotificationPhoneNumbers() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("notification_phone_numbers")
    .select(
      "id, user_id, phone_number, label, is_primary, verification_status, verified_at, created_at, updated_at"
    )
    .eq("user_id", profile.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message, phoneNumbers: [] };
  }

  return { phoneNumbers: data ?? [] };
}

export async function upsertUserNotificationPhoneNumber(
  values: NotificationPhoneNumberValues
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = notificationPhoneNumberSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Invalid notification phone number",
    };
  }

  if (parsed.data.is_primary) {
    const { error: primaryError } = await (supabase as any)
      .from("notification_phone_numbers")
      .update({ is_primary: false })
      .eq("user_id", profile.id);

    if (primaryError) {
      return { error: primaryError.message };
    }
  }

  const row = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    user_id: profile.id,
    phone_number: parsed.data.phone_number,
    label: parsed.data.label,
    is_primary: parsed.data.is_primary,
    verification_status: "unverified",
    verified_at: null,
  };

  const { error } = await (supabase as any)
    .from("notification_phone_numbers")
    .upsert(row);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "notification_preferences_updated",
    metadata: {
      phone_number_updated: true,
      is_primary: parsed.data.is_primary,
    },
  });

  revalidatePath("/settings/notifications");

  return { success: true };
}

export async function deleteUserNotificationPhoneNumber(
  id: string
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsed = z.string().uuid().safeParse(id);

  if (!parsed.success) {
    return { error: "Invalid phone number id" };
  }

  const { error } = await (supabase as any)
    .from("notification_phone_numbers")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", profile.id);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "notification_preferences_updated",
    metadata: {
      phone_number_deleted: true,
    },
  });

  revalidatePath("/settings/notifications");

  return { success: true };
}
