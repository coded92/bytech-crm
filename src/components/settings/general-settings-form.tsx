"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  Globe2,
  Mail,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  updateGeneralPreferencesAction,
  updateOrganizationInfoAction,
} from "@/lib/actions/general-settings";
import { cn } from "@/lib/utils";

type GeneralPreferences = {
  default_landing_page:
    | "dashboard"
    | "leads"
    | "customers"
    | "projects"
    | "field-jobs"
    | "support"
    | "inventory"
    | "payments"
    | "reports";
  items_per_page: 10 | 25 | 50 | 100;
  time_format: "12-hour" | "24-hour";
  date_format: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  inline_editing_enabled: boolean;
  start_of_week:
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";
  default_view_mode: "comfortable" | "compact";
  view_density: "comfortable" | "compact" | "condensed";
  highlight_color: string;
  show_avatars: boolean;
  show_tooltips: boolean;
  auto_save_changes: boolean;
  show_productivity_tips: boolean;
  confirm_before_deleting: boolean;
  keyboard_shortcuts_enabled: boolean;
};

type OrganizationSettings = {
  company_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
};

const defaultPreferences: GeneralPreferences = {
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

const accentColors = [
  "#4F46E5",
  "#0EA5E9",
  "#14B8A6",
  "#16A34A",
  "#F59E0B",
  "#F97316",
  "#EF4444",
];

const landingPageOptions = [
  { value: "dashboard", label: "Dashboard" },
  { value: "leads", label: "Leads" },
  { value: "customers", label: "Customers" },
  { value: "projects", label: "Projects" },
  { value: "field-jobs", label: "Field Jobs" },
  { value: "support", label: "Support" },
  { value: "inventory", label: "Inventory" },
  { value: "payments", label: "Payments" },
  { value: "reports", label: "Reports" },
] as const;

export function GeneralSettingsResetButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event("bytech:reset-general-settings"));
      }}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-[13px] font-black text-[var(--bytech-accent)] shadow-sm transition hover:bg-[#F1F0FC]"
    >
      <RotateCcw className="size-4" />
      Reset to Defaults
    </button>
  );
}

export function GeneralSettingsForm({
  organization,
  preferences,
  canManageOrganization,
}: {
  organization: OrganizationSettings;
  preferences: GeneralPreferences;
  canManageOrganization: boolean;
}) {
  const [values, setValues] = useState<GeneralPreferences>(preferences);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function resetPreferences() {
      setValues(defaultPreferences);
      setMessage("Preference fields reset to defaults. Save to apply.");
      setError("");
    }

    window.addEventListener("bytech:reset-general-settings", resetPreferences);
    return () => {
      window.removeEventListener(
        "bytech:reset-general-settings",
        resetPreferences
      );
    };
  }, []);

  function updateValue<Key extends keyof GeneralPreferences>(
    key: Key,
    value: GeneralPreferences[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      action={(formData) => {
        setError("");
        setMessage("");

        startTransition(async () => {
          if (canManageOrganization) {
            const organizationResult =
              await updateOrganizationInfoAction(formData);

            if ("error" in organizationResult) {
              setError(organizationResult.error);
              return;
            }
          }

          const preferenceResult =
            await updateGeneralPreferencesAction(formData);

          if ("error" in preferenceResult) {
            setError(preferenceResult.error);
            return;
          }

          setMessage("General settings saved successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <SettingsCard
          title="Organization Information"
          description="Update your organization's basic details."
        >
          {!canManageOrganization ? (
            <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              Organization information is admin-managed. You can view it but not
              edit it.
            </div>
          ) : null}
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Organization Name" htmlFor="company_name">
              <TextInput
                id="company_name"
                name="company_name"
                defaultValue={organization.company_name}
                disabled={!canManageOrganization}
                required={canManageOrganization}
                icon={<Save className="size-4" />}
              />
            </Field>
            <Field label="Organization Email" htmlFor="email">
              <TextInput
                id="email"
                name="email"
                type="email"
                defaultValue={organization.email ?? ""}
                disabled={!canManageOrganization}
                icon={<Mail className="size-4" />}
              />
            </Field>
            <Field label="Phone Number" htmlFor="phone">
              <TextInput
                id="phone"
                name="phone"
                defaultValue={organization.phone ?? ""}
                disabled={!canManageOrganization}
              />
            </Field>
            <Field label="Website" htmlFor="website">
              <TextInput
                id="website"
                name="website"
                defaultValue={organization.website ?? ""}
                disabled={!canManageOrganization}
                icon={<Globe2 className="size-4" />}
              />
            </Field>
            <Field
              label="Address"
              htmlFor="address"
              className="md:col-span-2"
            >
              <textarea
                id="address"
                name="address"
                rows={3}
                defaultValue={organization.address ?? ""}
                disabled={!canManageOrganization}
                className="min-h-20 w-full rounded-md border border-[#D8DDF0] bg-white px-3 py-3 text-[13px] font-medium text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              />
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="General Settings"
          description="Configure general settings that apply across your account."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-7 md:border-r md:border-slate-200 md:pr-6">
              <Field
                label="Default Landing Page"
                hint="Choose where you land after login."
                htmlFor="default_landing_page"
              >
                <SelectControl
                  id="default_landing_page"
                  name="default_landing_page"
                  value={values.default_landing_page}
                  onChange={(value) =>
                    updateValue(
                      "default_landing_page",
                      value as GeneralPreferences["default_landing_page"]
                    )
                  }
                >
                  {landingPageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectControl>
              </Field>
              <Field
                label="Items per page"
                hint="Select how many records to show per page."
                htmlFor="items_per_page"
              >
                <SelectControl
                  id="items_per_page"
                  name="items_per_page"
                  value={String(values.items_per_page)}
                  onChange={(value) =>
                    updateValue(
                      "items_per_page",
                      Number(value) as GeneralPreferences["items_per_page"]
                    )
                  }
                >
                  {[10, 25, 50, 100].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectControl>
              </Field>
              <ToggleRow
                label="Enable inline editing"
                description="Allow editing of records directly in the list view."
                checked={values.inline_editing_enabled}
                name="inline_editing_enabled"
                onChange={(checked) =>
                  updateValue("inline_editing_enabled", checked)
                }
              />
            </div>
            <div className="space-y-7">
              <RadioGroup
                label="Time Format"
                description="Choose how time is displayed."
                name="time_format"
                value={values.time_format}
                options={[
                  { value: "12-hour", label: "12-hour (e.g., 2:30 PM)" },
                  { value: "24-hour", label: "24-hour (e.g., 14:30)" },
                ]}
                onChange={(value) =>
                  updateValue(
                    "time_format",
                    value as GeneralPreferences["time_format"]
                  )
                }
              />
              <RadioGroup
                label="Date Format"
                description="Choose how dates are displayed."
                name="date_format"
                value={values.date_format}
                options={[
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                ]}
                onChange={(value) =>
                  updateValue(
                    "date_format",
                    value as GeneralPreferences["date_format"]
                  )
                }
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Week Settings"
          description="Set defaults for week-related preferences."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:border-r md:border-slate-200 md:pr-6">
              <Field
                label="Start of Week"
                hint="Select the first day of the week."
                htmlFor="start_of_week"
              >
                <SelectControl
                  id="start_of_week"
                  name="start_of_week"
                  value={values.start_of_week}
                  onChange={(value) =>
                    updateValue(
                      "start_of_week",
                      value as GeneralPreferences["start_of_week"]
                    )
                  }
                >
                  {[
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ].map((day) => (
                    <option key={day} value={day}>
                      {toTitle(day)}
                    </option>
                  ))}
                </SelectControl>
              </Field>
            </div>
            <RadioGroup
              label="Default View Mode"
              description="Choose your preferred list view mode."
              name="default_view_mode"
              value={values.default_view_mode}
              horizontal
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
              onChange={(value) =>
                updateValue(
                  "default_view_mode",
                  value as GeneralPreferences["default_view_mode"]
                )
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Display Settings"
          description="Customize how the application looks and displays information."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-7 md:border-r md:border-slate-200 md:pr-6">
              <RadioGroup
                label="Default View Density"
                description="Choose the default density for tables and lists."
                name="view_density"
                value={values.view_density}
                horizontal
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                  { value: "condensed", label: "Condensed" },
                ]}
                onChange={(value) =>
                  updateValue(
                    "view_density",
                    value as GeneralPreferences["view_density"]
                  )
                }
              />
              <ToggleRow
                label="Show Avatars"
                description="Show user avatars in lists and tables."
                checked={values.show_avatars}
                name="show_avatars"
                onChange={(checked) => updateValue("show_avatars", checked)}
              />
            </div>
            <div className="space-y-7">
              <ColorPicker
                value={values.highlight_color}
                onChange={(value) => updateValue("highlight_color", value)}
              />
              <ToggleRow
                label="Show Tooltips"
                description="Show helpful tooltips on hover."
                checked={values.show_tooltips}
                name="show_tooltips"
                onChange={(checked) => updateValue("show_tooltips", checked)}
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Other Settings"
          description="Miscellaneous settings for a better experience."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-7 md:border-r md:border-slate-200 md:pr-6">
              <ToggleRow
                label="Auto-save changes"
                description="Automatically save changes you make."
                checked={values.auto_save_changes}
                name="auto_save_changes"
                onChange={(checked) => updateValue("auto_save_changes", checked)}
              />
              <ToggleRow
                label="Confirm before deleting"
                description="Show confirmation dialog before deleting records."
                checked={values.confirm_before_deleting}
                name="confirm_before_deleting"
                onChange={(checked) =>
                  updateValue("confirm_before_deleting", checked)
                }
              />
            </div>
            <div className="space-y-7">
              <ToggleRow
                label="Show productivity tips"
                description="Display helpful tips and recommendations."
                checked={values.show_productivity_tips}
                name="show_productivity_tips"
                onChange={(checked) =>
                  updateValue("show_productivity_tips", checked)
                }
              />
              <ToggleRow
                label="Enable keyboard shortcuts"
                description="Use keyboard shortcuts for faster navigation."
                checked={values.keyboard_shortcuts_enabled}
                name="keyboard_shortcuts_enabled"
                onChange={(checked) =>
                  updateValue("keyboard_shortcuts_enabled", checked)
                }
              />
            </div>
          </div>
        </SettingsCard>

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--bytech-accent)] px-5 text-[13px] font-black text-white shadow-lg shadow-indigo-200 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => {
              setValues(preferences);
              setError("");
              setMessage("");
            }}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-5 text-[13px] font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E1E5F3] bg-white px-5 py-5 shadow-sm shadow-indigo-100/20">
      <div className="mb-5">
        <h2 className="text-[15px] font-black text-[#111827]">{title}</h2>
        <p className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block space-y-2", className)} htmlFor={htmlFor}>
      <span className="block text-[11px] font-black text-[#172554]">{label}</span>
      {hint ? (
        <span className="block text-[11px] font-medium text-slate-500">{hint}</span>
      ) : null}
      {children}
    </label>
  );
}

function TextInput({
  icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-md border border-[#D8DDF0] bg-white px-3 text-[13px] font-medium text-[#111827] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          icon && "pr-10",
          className
        )}
      />
      {icon ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
      ) : null}
    </div>
  );
}

function SelectControl({
  children,
  onChange,
  ...props
}: Omit<React.ComponentProps<"select">, "onChange"> & {
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        {...props}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-md border border-[#D8DDF0] bg-white px-3 pr-10 text-[13px] font-bold text-[#111827] shadow-sm outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function RadioGroup({
  label,
  description,
  name,
  value,
  options,
  horizontal = false,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  horizontal?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-black text-[#172554]">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-slate-500">{description}</p>
      <div className={cn("mt-3 grid gap-3", horizontal && "sm:grid-cols-2")}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#111827]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-[#4F46E5]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  name,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  name: keyof GeneralPreferences;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-black text-[#172554]">{label}</p>
        <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <input type="hidden" name={name} value={checked ? "true" : "false"} />
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-[var(--bytech-accent)]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full bg-white shadow transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <input type="hidden" name="highlight_color" value={value} />
      <p className="text-[11px] font-black text-[#172554]">Highlight Color</p>
      <p className="mt-1 text-[11px] font-medium text-slate-500">
        Choose the primary highlight color for the platform.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {accentColors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Use ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 transition",
              value === color
                ? "border-[var(--bytech-accent)] ring-4 ring-indigo-100"
                : "border-transparent"
            )}
          >
            <span
              className="block size-5 rounded-full"
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
