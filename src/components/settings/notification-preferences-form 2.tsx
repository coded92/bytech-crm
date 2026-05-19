"use client";

import { useMemo, useState, useTransition } from "react";
import { updateUserNotificationPreferences } from "@/lib/actions/notification-preferences";
import { Button } from "@/components/ui/button";

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

const channels: Array<{ key: Channel; label: string; note: string }> = [
  { key: "email", label: "Email", note: "Preference only. Delivery provider is not configured here." },
  { key: "in_app", label: "In-App", note: "Used by the existing CRM notification center." },
  { key: "sms", label: "SMS", note: "Preference only. SMS delivery is not implemented." },
];

const eventTypes: Array<{ key: EventType; label: string }> = [
  { key: "customer_updates", label: "Customer updates" },
  { key: "customer_activity", label: "Customer activity" },
  { key: "project_updates", label: "Project updates" },
  { key: "task_assignments", label: "Task assignments" },
  { key: "invoice_alerts", label: "Invoice alerts" },
  { key: "payment_alerts", label: "Payment alerts" },
  { key: "field_job_updates", label: "Field job updates" },
  { key: "inventory_alerts", label: "Inventory alerts" },
  { key: "support_updates", label: "Support updates" },
  { key: "support_tickets", label: "Support tickets" },
  { key: "system_alerts", label: "System alerts" },
  { key: "system_maintenance", label: "System maintenance" },
  { key: "critical_alerts", label: "Critical alerts" },
  { key: "mentions_comments", label: "Mentions & comments" },
  { key: "marketing_news", label: "Marketing & news" },
];

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: PreferenceRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initial = useMemo(() => buildState(preferences), [preferences]);
  const [values, setValues] = useState<Record<string, PreferenceRow>>(initial);

  function updateValue(key: string, patch: Partial<PreferenceRow>) {
    setValues((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  return (
    <div className="space-y-5">
      {channels.map((channel) => (
        <section
          key={channel.key}
          className="rounded-[1.35rem] border border-indigo-100 bg-[#F8F7FF] p-3 sm:p-4"
        >
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">{channel.label}</h3>
              <p className="text-xs leading-5 text-slate-500">{channel.note}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-indigo-100 bg-white">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-indigo-50/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Event</th>
                  <th className="px-3 py-3 font-semibold">Enabled</th>
                  <th className="px-3 py-3 font-semibold">Digest</th>
                  <th className="px-3 py-3 font-semibold">Quiet Hours</th>
                  <th className="px-3 py-3 font-semibold">Start</th>
                  <th className="px-3 py-3 font-semibold">End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/70">
                {eventTypes.map((eventType) => {
                  const key = `${channel.key}:${eventType.key}`;
                  const row = values[key];

                  return (
                    <tr key={key}>
                      <td className="px-3 py-3 font-semibold text-[#111827]">
                        {eventType.label}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(event) =>
                            updateValue(key, { enabled: event.target.checked })
                          }
                          className="size-4 accent-[#4F46E5]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={row.digest_frequency ?? ""}
                          onChange={(event) =>
                            updateValue(key, {
                              digest_frequency:
                                event.target.value === ""
                                  ? null
                                  : (event.target.value as PreferenceRow["digest_frequency"]),
                            })
                          }
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm"
                        >
                          <option value="">None</option>
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={row.quiet_hours_enabled}
                          onChange={(event) =>
                            updateValue(key, {
                              quiet_hours_enabled: event.target.checked,
                            })
                          }
                          className="size-4 accent-[#4F46E5]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="time"
                          value={row.quiet_hours_start ?? ""}
                          onChange={(event) =>
                            updateValue(key, {
                              quiet_hours_start: event.target.value || null,
                            })
                          }
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="time"
                          value={row.quiet_hours_end ?? ""}
                          onChange={(event) =>
                            updateValue(key, {
                              quiet_hours_end: event.target.value || null,
                            })
                          }
                          className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError("");
          setMessage("");
          startTransition(async () => {
            const result = await updateUserNotificationPreferences(
              Object.values(values)
            );

            if ("error" in result) {
              setError(result.error);
              return;
            }

            setMessage("Notification preferences saved.");
          });
        }}
      >
        {isPending ? "Saving..." : "Save Notification Preferences"}
      </Button>
    </div>
  );
}

function buildState(preferences: PreferenceRow[]) {
  const map = new Map(
    preferences.map((preference) => [
      `${preference.channel}:${preference.event_type}`,
      preference,
    ])
  );
  const state: Record<string, PreferenceRow> = {};

  for (const channel of channels) {
    for (const eventType of eventTypes) {
      const key = `${channel.key}:${eventType.key}`;
      state[key] =
        map.get(key) ?? {
          channel: channel.key,
          event_type: eventType.key,
          enabled: channel.key === "in_app",
          digest_frequency: null,
          quiet_hours_enabled: false,
          quiet_hours_start: null,
          quiet_hours_end: null,
        };
    }
  }

  return state;
}
