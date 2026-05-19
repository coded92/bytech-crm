import Link from "next/link";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import {
  SettingsWorkspace,
} from "@/components/settings/settings-workspace";
import { Button } from "@/components/ui/button";

type NotificationPreferenceRow = {
  channel: "email" | "in_app" | "sms";
  event_type:
    | "customer_updates"
    | "customer_activity"
    | "project_updates"
    | "task_assignments"
    | "invoice_alerts"
    | "payment_alerts"
    | "field_job_updates"
    | "inventory_alerts"
    | "support_updates"
    | "support_tickets"
    | "system_alerts"
    | "system_maintenance"
    | "critical_alerts"
    | "mentions_comments"
    | "marketing_news";
  enabled: boolean;
  digest_frequency: "immediate" | "daily" | "weekly" | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

type NotificationChannelSettingsRow = {
  channel: "email" | "in_app" | "sms";
  email_frequency: "instant" | "daily" | "weekly" | null;
  email_format: "html" | "plain_text" | null;
  digest_summary_enabled: boolean;
  include_read_items: boolean;
  browser_notifications_enabled: boolean;
  play_sound: boolean;
  show_unread_count: boolean;
  sms_delivery_priority: "normal" | "high" | "critical" | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string | null;
};

type NotificationPhoneNumberRow = {
  id: string;
  phone_number: string;
  label: string;
  is_primary: boolean;
  verification_status: "unverified" | "pending" | "verified";
  verified_at: string | null;
};

type RecentNotificationRow = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
};

export default async function SettingsNotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [
    { data: preferencesData },
    { data: channelSettingsData },
    { data: phoneNumbersData },
    { data: recentNotificationsData },
  ] = await Promise.all([
    (supabase as any)
      .from("notification_preferences")
      .select(
        "channel, event_type, enabled, digest_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end"
      )
      .eq("user_id", profile.id),
    (supabase as any)
      .from("notification_channel_settings")
      .select(
        "channel, email_frequency, email_format, digest_summary_enabled, include_read_items, browser_notifications_enabled, play_sound, show_unread_count, sms_delivery_priority, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone"
      )
      .eq("user_id", profile.id),
    (supabase as any)
      .from("notification_phone_numbers")
      .select("id, phone_number, label, is_primary, verification_status, verified_at")
      .eq("user_id", profile.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
    (supabase as any)
      .from("notifications")
      .select("id, title, message, created_at, is_read")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const preferences = (preferencesData ?? []) as NotificationPreferenceRow[];
  const channelSettings = (channelSettingsData ?? []) as NotificationChannelSettingsRow[];
  const phoneNumbers = (phoneNumbersData ?? []) as NotificationPhoneNumberRow[];
  const recentNotifications = (recentNotificationsData ?? []) as RecentNotificationRow[];

  return (
    <SettingsWorkspace
      active="notifications"
      title="Notifications"
      description="Manage how and when you receive notifications across BYTECH CRM."
      eyebrow=""
      isAdmin={profile.role === "admin"}
      headerAction={
        <Button asChild variant="outline" className="border-[var(--bytech-accent)] text-[var(--bytech-accent)]">
          <Link href="/notifications">
            <Clock3 className="size-4" />
            Notification History
          </Link>
        </Button>
      }
    >
      <NotificationPreferencesForm
        preferences={preferences}
        channelSettings={channelSettings}
        phoneNumbers={phoneNumbers}
        recentNotifications={recentNotifications}
      />
    </SettingsWorkspace>
  );
}
