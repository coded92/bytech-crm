"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CheckSquare,
  Clock3,
  CreditCard,
  Headphones,
  Mail,
  Megaphone,
  MessageCircle,
  MonitorSmartphone,
  Package,
  Phone,
  Plus,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import {
  deleteUserNotificationPhoneNumber,
  updateUserNotificationChannelSettings,
  updateUserNotificationPreferences,
  upsertUserNotificationPhoneNumber,
} from "@/lib/actions/notification-preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type Channel = "email" | "in_app" | "sms";
type EventType =
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

type PreferenceRow = {
  channel: Channel;
  event_type: EventType;
  enabled: boolean;
  digest_frequency: "immediate" | "daily" | "weekly" | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

type ChannelSettingsRow = {
  channel: Channel;
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

type PhoneNumberRow = {
  id: string;
  phone_number: string;
  label: string;
  is_primary: boolean;
  verification_status: "unverified" | "pending" | "verified";
  verified_at: string | null;
};

type RecentNotification = {
  id: string;
  title: string;
  message: string | null;
  created_at: string;
  is_read: boolean;
};

const channels: Array<{ key: Channel; label: string; icon: typeof Mail }> = [
  { key: "email", label: "Email Notifications", icon: Mail },
  { key: "in_app", label: "In-App Notifications", icon: Bell },
  { key: "sms", label: "SMS Notifications", icon: MessageCircle },
];

const categoryCatalog: Record<
  EventType,
  {
    label: string;
    description: string;
    icon: typeof Users;
    tone: string;
  }
> = {
  customer_updates: {
    label: "Customer Updates",
    description: "New customers, profile changes, and account updates",
    icon: Users,
    tone: "bg-blue-50 text-blue-600",
  },
  customer_activity: {
    label: "Customer Activity",
    description: "Customer activity, changes, and important updates",
    icon: Users,
    tone: "bg-blue-50 text-blue-600",
  },
  project_updates: {
    label: "Project Updates",
    description: "Project status, tasks, milestones, and deadlines",
    icon: BriefcaseBusiness,
    tone: "bg-emerald-50 text-emerald-600",
  },
  task_assignments: {
    label: "Task & Assignment Alerts",
    description: "Tasks assigned, due soon, and overdue tasks",
    icon: CheckSquare,
    tone: "bg-orange-50 text-orange-600",
  },
  invoice_alerts: {
    label: "Invoice & Payment Alerts",
    description: "Invoices, payment received, and overdue reminders",
    icon: CreditCard,
    tone: "bg-orange-50 text-orange-600",
  },
  payment_alerts: {
    label: "Payment Alerts",
    description: "Payment confirmations, receipts, and account updates",
    icon: CreditCard,
    tone: "bg-sky-50 text-sky-600",
  },
  field_job_updates: {
    label: "Field Job Updates",
    description: "New jobs, assignments, status updates, and completions",
    icon: Wrench,
    tone: "bg-violet-50 text-violet-600",
  },
  inventory_alerts: {
    label: "Inventory Alerts",
    description: "Low stock, out of stock, and stock level updates",
    icon: Package,
    tone: "bg-red-50 text-red-600",
  },
  support_updates: {
    label: "Support Updates",
    description: "Support ticket status, replies, and resolutions",
    icon: Headphones,
    tone: "bg-cyan-50 text-cyan-600",
  },
  support_tickets: {
    label: "Support Tickets",
    description: "New tickets, replies, and ticket updates",
    icon: Headphones,
    tone: "bg-cyan-50 text-cyan-600",
  },
  system_alerts: {
    label: "System Alerts",
    description: "Important system updates and maintenance alerts",
    icon: Bell,
    tone: "bg-amber-50 text-amber-600",
  },
  system_maintenance: {
    label: "System & Maintenance",
    description: "Maintenance windows and platform update notices",
    icon: Settings2,
    tone: "bg-slate-100 text-slate-600",
  },
  critical_alerts: {
    label: "Critical Alerts",
    description: "Urgent system alerts and critical issues",
    icon: ShieldAlert,
    tone: "bg-emerald-50 text-emerald-600",
  },
  mentions_comments: {
    label: "Mentions & Comments",
    description: "When someone mentions you or comments",
    icon: MessageCircle,
    tone: "bg-slate-100 text-slate-600",
  },
  marketing_news: {
    label: "Marketing & News",
    description: "Product updates, tips, and announcements",
    icon: Megaphone,
    tone: "bg-indigo-50 text-indigo-600",
  },
};

const channelCategories: Record<Channel, EventType[]> = {
  email: [
    "customer_updates",
    "project_updates",
    "invoice_alerts",
    "field_job_updates",
    "inventory_alerts",
    "support_tickets",
    "system_alerts",
    "marketing_news",
  ],
  in_app: [
    "customer_activity",
    "project_updates",
    "task_assignments",
    "invoice_alerts",
    "field_job_updates",
    "inventory_alerts",
    "support_tickets",
    "system_alerts",
    "mentions_comments",
    "marketing_news",
  ],
  sms: [
    "critical_alerts",
    "invoice_alerts",
    "payment_alerts",
    "project_updates",
    "customer_activity",
    "task_assignments",
    "field_job_updates",
    "inventory_alerts",
    "support_tickets",
    "system_maintenance",
    "marketing_news",
  ],
};

export function NotificationPreferencesForm({
  preferences,
  channelSettings,
  phoneNumbers,
  recentNotifications,
}: {
  preferences: PreferenceRow[];
  channelSettings: ChannelSettingsRow[];
  phoneNumbers: PhoneNumberRow[];
  recentNotifications: RecentNotification[];
}) {
  const [activeChannel, setActiveChannel] = useState<Channel>("email");
  const [isPending, startTransition] = useTransition();
  const [isPhonePending, startPhoneTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhoneLabel, setNewPhoneLabel] = useState("Primary Number");
  const initialPreferences = useMemo(() => buildPreferenceState(preferences), [preferences]);
  const initialChannelSettings = useMemo(
    () => buildChannelSettingsState(channelSettings),
    [channelSettings]
  );
  const [preferenceValues, setPreferenceValues] = useState(initialPreferences);
  const [settingsValues, setSettingsValues] = useState(initialChannelSettings);

  const activeSettings = settingsValues[activeChannel];

  function updatePreference(key: string, patch: Partial<PreferenceRow>) {
    setPreferenceValues((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function updateChannelSettings(channel: Channel, patch: Partial<ChannelSettingsRow>) {
    setSettingsValues((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        ...patch,
      },
    }));
  }

  function saveAll() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const preferenceResult = await updateUserNotificationPreferences(
        Object.values(preferenceValues)
      );

      if ("error" in preferenceResult) {
        setError(preferenceResult.error);
        return;
      }

      const settingsResult = await updateUserNotificationChannelSettings(
        Object.values(settingsValues)
      );

      if ("error" in settingsResult) {
        setError(settingsResult.error);
        return;
      }

      setMessage("Notification preferences saved.");
    });
  }

  function addPhoneNumber() {
    setPhoneError("");
    setPhoneMessage("");

    startPhoneTransition(async () => {
      const result = await upsertUserNotificationPhoneNumber({
        phone_number: newPhoneNumber,
        label: newPhoneLabel,
        is_primary: phoneNumbers.length === 0,
      });

      if ("error" in result) {
        setPhoneError(result.error);
        return;
      }

      setNewPhoneNumber("");
      setNewPhoneLabel("Primary Number");
      setPhoneMessage("Phone number saved.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex border-b border-slate-200">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const selected = channel.key === activeChannel;

          return (
            <button
              key={channel.key}
              type="button"
              onClick={() => setActiveChannel(channel.key)}
              className={cn(
                "inline-flex min-h-12 flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-bold transition sm:flex-none sm:px-5",
                selected
                  ? "border-[var(--bytech-accent)] text-[var(--bytech-accent)]"
                  : "border-transparent text-[#111827] hover:text-[var(--bytech-accent)]"
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{channel.label}</span>
              <span className="sm:hidden">{channel.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {activeChannel === "email" ? (
        <EmailPanel
          preferences={preferenceValues}
          settings={activeSettings}
          onPreferenceChange={updatePreference}
          onSettingsChange={(patch) => updateChannelSettings("email", patch)}
        />
      ) : null}

      {activeChannel === "in_app" ? (
        <InAppPanel
          preferences={preferenceValues}
          settings={activeSettings}
          recentNotifications={recentNotifications}
          onPreferenceChange={updatePreference}
          onSettingsChange={(patch) => updateChannelSettings("in_app", patch)}
        />
      ) : null}

      {activeChannel === "sms" ? (
        <SmsPanel
          preferences={preferenceValues}
          settings={activeSettings}
          phoneNumbers={phoneNumbers}
          newPhoneNumber={newPhoneNumber}
          newPhoneLabel={newPhoneLabel}
          isPhonePending={isPhonePending}
          phoneMessage={phoneMessage}
          phoneError={phoneError}
          onPreferenceChange={updatePreference}
          onSettingsChange={(patch) => updateChannelSettings("sms", patch)}
          onPhoneNumberChange={setNewPhoneNumber}
          onPhoneLabelChange={setNewPhoneLabel}
          onAddPhoneNumber={addPhoneNumber}
          onDeletePhoneNumber={(id) => {
            setPhoneError("");
            setPhoneMessage("");
            startPhoneTransition(async () => {
              const result = await deleteUserNotificationPhoneNumber(id);
              if ("error" in result) {
                setPhoneError(result.error);
                return;
              }
              setPhoneMessage("Phone number removed.");
            });
          }}
        />
      ) : null}

      <div className="flex flex-col items-start justify-between gap-3 rounded-[1.4rem] border border-indigo-100 bg-white p-4 shadow-sm shadow-indigo-100/50 sm:flex-row sm:items-center">
        <div>
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
          {!error && !message ? (
            <p className="text-sm font-medium text-slate-500">
              Changes are saved to your account preferences. Delivery providers remain separate.
            </p>
          ) : null}
        </div>
        <Button type="button" disabled={isPending} onClick={saveAll} className="w-full sm:w-auto">
          <Save className="size-4" />
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}

function EmailPanel({
  preferences,
  settings,
  onPreferenceChange,
  onSettingsChange,
}: {
  preferences: Record<string, PreferenceRow>;
  settings: ChannelSettingsRow;
  onPreferenceChange: (key: string, patch: Partial<PreferenceRow>) => void;
  onSettingsChange: (patch: Partial<ChannelSettingsRow>) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
      <SettingsCard
        title="Email Notification Preferences"
        description="Choose what updates you want to receive through email."
      >
        <CategoryList
          channel="email"
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
        />
        <div className="mt-8 rounded-2xl bg-[#F7F5FF] px-4 py-4 text-sm font-semibold text-[var(--bytech-accent)]">
          Want fewer emails? Use digest frequency to reduce email volume.
        </div>
      </SettingsCard>

      <div className="space-y-5">
        <SettingsCard
          title="Email Delivery Preferences"
          description="Control how you receive email notifications."
        >
          <SettingRow label="Email Frequency" description="How often emails should be grouped.">
            <SelectBox
              value={settings.email_frequency ?? "instant"}
              onChange={(value) =>
                onSettingsChange({
                  email_frequency: value as ChannelSettingsRow["email_frequency"],
                })
              }
              options={[
                ["instant", "Instant"],
                ["daily", "Daily"],
                ["weekly", "Weekly"],
              ]}
            />
          </SettingRow>
          <SettingRow label="Email Format" description="Preferred email content format.">
            <SelectBox
              value={settings.email_format ?? "html"}
              onChange={(value) =>
                onSettingsChange({
                  email_format: value as ChannelSettingsRow["email_format"],
                })
              }
              options={[
                ["html", "HTML"],
                ["plain_text", "Plain text"],
              ]}
            />
          </SettingRow>
          <SettingRow label="Digest Summary" description="Receive a summary of notifications.">
            <Toggle
              checked={settings.digest_summary_enabled}
              onChange={(checked) =>
                onSettingsChange({ digest_summary_enabled: checked })
              }
            />
          </SettingRow>
          <SettingRow label="Include Read Items" description="Include read items in email digests.">
            <Toggle
              checked={settings.include_read_items}
              onChange={(checked) => onSettingsChange({ include_read_items: checked })}
            />
          </SettingRow>
        </SettingsCard>

        <QuietHoursCard settings={settings} onChange={onSettingsChange} title="Quiet Hours" />
      </div>
    </div>
  );
}

function InAppPanel({
  preferences,
  settings,
  recentNotifications,
  onPreferenceChange,
  onSettingsChange,
}: {
  preferences: Record<string, PreferenceRow>;
  settings: ChannelSettingsRow;
  recentNotifications: RecentNotification[];
  onPreferenceChange: (key: string, patch: Partial<PreferenceRow>) => void;
  onSettingsChange: (patch: Partial<ChannelSettingsRow>) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
      <SettingsCard
        title="Notification Categories"
        description="Choose what in-app notifications you want to receive."
      >
        <CategoryList
          channel="in_app"
          preferences={preferences}
          onPreferenceChange={onPreferenceChange}
        />
      </SettingsCard>

      <div className="space-y-5">
        <SettingsCard
          title="In-App Notification Preview"
          description="Recent items from the real notification center."
        >
          {recentNotifications.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0"
                >
                  <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[var(--bytech-accent)]">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#111827]">
                      {notification.title}
                    </p>
                    {notification.message ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {notification.message}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              No recent notifications yet.
            </div>
          )}
        </SettingsCard>

        <SettingsCard title="Preference Settings" description="Control in-app notification behavior.">
          <SettingRow
            label="Show Browser Notifications"
            description="Stores the preference. Push subscriptions require a later provider phase."
          >
            <Toggle
              checked={settings.browser_notifications_enabled}
              onChange={(checked) =>
                onSettingsChange({ browser_notifications_enabled: checked })
              }
            />
          </SettingRow>
          <SettingRow label="Play Sound" description="Play a sound when new alerts arrive.">
            <Toggle
              checked={settings.play_sound}
              onChange={(checked) => onSettingsChange({ play_sound: checked })}
            />
          </SettingRow>
          <SettingRow label="Show Unread Count on Icon" description="Display unread badge counts.">
            <Toggle
              checked={settings.show_unread_count}
              onChange={(checked) => onSettingsChange({ show_unread_count: checked })}
            />
          </SettingRow>
          <div className="mt-4 rounded-2xl bg-[#F1ECFF] px-4 py-3 text-sm font-semibold text-[var(--bytech-accent)]">
            Critical security and system notices should remain enabled for operational safety.
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SmsPanel({
  preferences,
  settings,
  phoneNumbers,
  newPhoneNumber,
  newPhoneLabel,
  isPhonePending,
  phoneMessage,
  phoneError,
  onPreferenceChange,
  onSettingsChange,
  onPhoneNumberChange,
  onPhoneLabelChange,
  onAddPhoneNumber,
  onDeletePhoneNumber,
}: {
  preferences: Record<string, PreferenceRow>;
  settings: ChannelSettingsRow;
  phoneNumbers: PhoneNumberRow[];
  newPhoneNumber: string;
  newPhoneLabel: string;
  isPhonePending: boolean;
  phoneMessage: string;
  phoneError: string;
  onPreferenceChange: (key: string, patch: Partial<PreferenceRow>) => void;
  onSettingsChange: (patch: Partial<ChannelSettingsRow>) => void;
  onPhoneNumberChange: (value: string) => void;
  onPhoneLabelChange: (value: string) => void;
  onAddPhoneNumber: () => void;
  onDeletePhoneNumber: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        <SettingsCard
          title="SMS Notification Preferences"
          description="Choose which SMS notifications should be allowed once a provider is connected."
        >
          <CategoryList
            channel="sms"
            preferences={preferences}
            onPreferenceChange={onPreferenceChange}
          />
        </SettingsCard>

        <div className="space-y-5">
          <SettingsCard title="Phone Numbers" description="Manage phone numbers for SMS preferences.">
            <div className="space-y-3">
              {phoneNumbers.length > 0 ? (
                phoneNumbers.map((phone) => (
                  <div
                    key={phone.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                      phone.is_primary
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#111827]">{phone.label}</p>
                        {phone.is_primary ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            Primary
                          </span>
                        ) : null}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize text-slate-600">
                          {phone.verification_status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {phone.phone_number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeletePhoneNumber(phone.id)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                      aria-label="Remove phone number"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No SMS phone numbers saved yet.
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={newPhoneLabel}
                onChange={(event) => onPhoneLabelChange(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[var(--bytech-accent)]"
                placeholder="Label"
              />
              <input
                value={newPhoneNumber}
                onChange={(event) => onPhoneNumberChange(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[var(--bytech-accent)]"
                placeholder="+234..."
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPhonePending}
                onClick={onAddPhoneNumber}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            {phoneError ? <p className="mt-3 text-sm font-semibold text-red-600">{phoneError}</p> : null}
            {phoneMessage ? (
              <p className="mt-3 text-sm font-semibold text-emerald-600">{phoneMessage}</p>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Phone verification and SMS provider delivery will be wired in a later backend phase.
            </p>
          </SettingsCard>

          <SettingsCard title="SMS Delivery Settings" description="Stored delivery preferences.">
            <SettingRow label="Delivery Priority" description="Preferred priority when SMS delivery is connected.">
              <SelectBox
                value={settings.sms_delivery_priority ?? "high"}
                onChange={(value) =>
                  onSettingsChange({
                    sms_delivery_priority: value as ChannelSettingsRow["sms_delivery_priority"],
                  })
                }
                options={[
                  ["normal", "Normal"],
                  ["high", "High"],
                  ["critical", "Critical"],
                ]}
              />
            </SettingRow>
            <QuietHoursFields settings={settings} onChange={onSettingsChange} prefix="SMS" />
          </SettingsCard>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-indigo-100 bg-[#F7F5FF] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7E2FF] text-[var(--bytech-accent)]">
            <Phone className="size-5" />
          </span>
          <div>
            <p className="font-black text-[#111827]">SMS backend foundation is ready</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Preferences and phone numbers are now real data. SMS credits, buying, OTP verification, and provider delivery are intentionally not shown until provider integration exists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryList({
  channel,
  preferences,
  onPreferenceChange,
}: {
  channel: Channel;
  preferences: Record<string, PreferenceRow>;
  onPreferenceChange: (key: string, patch: Partial<PreferenceRow>) => void;
}) {
  return (
    <div className="divide-y divide-slate-200">
      {channelCategories[channel].map((eventType) => {
        const key = `${channel}:${eventType}`;
        const row = preferences[key];
        const category = categoryCatalog[eventType];
        const Icon = category.icon;

        return (
          <div key={key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                category.tone
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#111827]">{category.label}</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {category.description}
              </p>
            </div>
            <Toggle
              checked={row.enabled}
              onChange={(checked) => onPreferenceChange(key, { enabled: checked })}
            />
          </div>
        );
      })}
    </div>
  );
}

function QuietHoursCard({
  settings,
  onChange,
  title,
}: {
  settings: ChannelSettingsRow;
  onChange: (patch: Partial<ChannelSettingsRow>) => void;
  title: string;
}) {
  return (
    <SettingsCard title={title} description="Pause non-urgent notifications during these hours.">
      <QuietHoursFields settings={settings} onChange={onChange} />
    </SettingsCard>
  );
}

function QuietHoursFields({
  settings,
  onChange,
  prefix = "Notifications",
}: {
  settings: ChannelSettingsRow;
  onChange: (patch: Partial<ChannelSettingsRow>) => void;
  prefix?: string;
}) {
  return (
    <>
      <SettingRow label="Enable Quiet Hours" description={`Pause ${prefix.toLowerCase()} during specific hours.`}>
        <Toggle
          checked={settings.quiet_hours_enabled}
          onChange={(checked) => onChange({ quiet_hours_enabled: checked })}
        />
      </SettingRow>
      <SettingRow label="Start Time" description={`${prefix} will pause at this time.`}>
        <input
          type="time"
          value={settings.quiet_hours_start ?? ""}
          onChange={(event) => onChange({ quiet_hours_start: event.target.value || null })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[var(--bytech-accent)] sm:w-40"
        />
      </SettingRow>
      <SettingRow label="End Time" description={`${prefix} will resume at this time.`}>
        <input
          type="time"
          value={settings.quiet_hours_end ?? ""}
          onChange={(event) => onChange({ quiet_hours_end: event.target.value || null })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[var(--bytech-accent)] sm:w-40"
        />
      </SettingRow>
      <SettingRow label="Time Zone" description="Your local time zone.">
        <input
          value={settings.timezone ?? ""}
          onChange={(event) => onChange({ timezone: event.target.value || null })}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-[var(--bytech-accent)] sm:w-64"
          placeholder="Africa/Lagos"
        />
      </SettingRow>
    </>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/40">
      <div className="mb-5">
        <h2 className="text-lg font-black tracking-tight text-[#111827]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#111827]">{label}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
        checked ? "bg-[var(--bytech-accent)]" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SelectBox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#111827] outline-none focus:border-[var(--bytech-accent)]"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

function buildPreferenceState(preferences: PreferenceRow[]) {
  const map = new Map(
    preferences.map((preference) => [
      `${preference.channel}:${preference.event_type}`,
      preference,
    ])
  );
  const state: Record<string, PreferenceRow> = {};

  for (const channel of channels) {
    for (const eventType of channelCategories[channel.key]) {
      const key = `${channel.key}:${eventType}`;
      state[key] =
        map.get(key) ?? {
          channel: channel.key,
          event_type: eventType,
          enabled: !["marketing_news", "mentions_comments", "system_maintenance"].includes(eventType),
          digest_frequency: null,
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        };
    }
  }

  return state;
}

function buildChannelSettingsState(settings: ChannelSettingsRow[]) {
  const map = new Map(settings.map((setting) => [setting.channel, setting]));
  const defaults: Record<Channel, ChannelSettingsRow> = {
    email: {
      channel: "email",
      email_frequency: "instant",
      email_format: "html",
      digest_summary_enabled: false,
      include_read_items: false,
      browser_notifications_enabled: false,
      play_sound: true,
      show_unread_count: true,
      sms_delivery_priority: null,
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      timezone: "Africa/Lagos",
    },
    in_app: {
      channel: "in_app",
      email_frequency: null,
      email_format: null,
      digest_summary_enabled: false,
      include_read_items: false,
      browser_notifications_enabled: false,
      play_sound: true,
      show_unread_count: true,
      sms_delivery_priority: null,
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: "Africa/Lagos",
    },
    sms: {
      channel: "sms",
      email_frequency: null,
      email_format: null,
      digest_summary_enabled: false,
      include_read_items: false,
      browser_notifications_enabled: false,
      play_sound: true,
      show_unread_count: true,
      sms_delivery_priority: "high",
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      timezone: "Africa/Lagos",
    },
  };

  return {
    email: map.get("email") ?? defaults.email,
    in_app: map.get("in_app") ?? defaults.in_app,
    sms: map.get("sms") ?? defaults.sms,
  };
}
