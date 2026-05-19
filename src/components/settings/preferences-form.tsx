"use client";

import { useState, useTransition } from "react";
import { updateMyPreferencesAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Preferences = {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  compact_mode: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
};

const selectClass =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm shadow-sm shadow-indigo-100/40 outline-none focus:border-[#4F46E5]/40 focus:ring-3 focus:ring-[#4F46E5]/15";

export function PreferencesForm({ preferences }: { preferences: Preferences }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");
        setMessage("");
        startTransition(async () => {
          const result = await updateMyPreferencesAction(formData);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setMessage("Preferences saved.");
        });
      }}
      className="space-y-5"
    >
      <fieldset disabled={isPending} className="grid gap-4 md:grid-cols-2">
        <Field label="Theme">
          <select name="theme" defaultValue={preferences.theme} className={selectClass}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </Field>

        <Field label="Language">
          <Input name="language" defaultValue={preferences.language} />
        </Field>

        <Field label="Timezone">
          <Input name="timezone" defaultValue={preferences.timezone} />
        </Field>

        <div className="rounded-2xl border border-indigo-100 bg-[#F8F7FF] p-4">
          <p className="text-sm font-semibold text-[#111827]">Workspace density</p>
          <label className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Compact mode</span>
            <input
              type="checkbox"
              name="compact_mode"
              defaultChecked={preferences.compact_mode}
              className="size-4 accent-[#4F46E5]"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-[#F8F7FF] p-4 md:col-span-2">
          <p className="text-sm font-semibold text-[#111827]">Global notification switches</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-3 py-3 text-sm text-slate-600">
              <span>Email notifications</span>
              <input
                type="checkbox"
                name="email_notifications"
                defaultChecked={preferences.email_notifications}
                className="size-4 accent-[#4F46E5]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white px-3 py-3 text-sm text-slate-600">
              <span>Push notifications</span>
              <input
                type="checkbox"
                name="push_notifications"
                defaultChecked={preferences.push_notifications}
                className="size-4 accent-[#4F46E5]"
              />
            </label>
          </div>
        </div>
      </fieldset>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Preferences"}
      </Button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-[#111827]">{label}</span>
      {children}
    </label>
  );
}
