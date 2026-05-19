"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  GitBranch,
  KeyRound,
  Link2,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import {
  resetTeamManagementSettingsAction,
  updateTeamManagementSettingsAction,
} from "@/lib/actions/team-settings";
import type { TeamManagementSettingsValues } from "@/lib/validations/team-settings";
import { cn } from "@/lib/utils";

type RoleOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role_type: "system" | "custom";
  role_level: number;
  is_active: boolean;
};

type TeamManagementSettingsFormProps = {
  settings: TeamManagementSettingsValues;
  roles: RoleOption[];
  options: {
    autoAssignDepartmentModes: readonly string[];
    departments: readonly string[];
    approvalWorkflows: readonly string[];
    approvalChains: readonly string[];
    defaultMemberViews: readonly string[];
    itemsPerPage: readonly number[];
    dateFormats: readonly string[];
    salaryVisibilityOptions: readonly string[];
    departmentVisibilityOptions: readonly string[];
    dataExportPermissionOptions: readonly string[];
    integrationStatusOptions: readonly string[];
  };
  limitations: Record<string, string>;
};

export function TeamManagementSettingsResetButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await resetTeamManagementSettingsAction();
          router.refresh();
        });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-[13px] font-black text-[var(--bytech-accent)] shadow-sm transition hover:bg-[#F1F0FC] disabled:opacity-60"
    >
      <SlidersHorizontal className="size-4" />
      Reset to Defaults
    </button>
  );
}

export function TeamManagementSettingsForm({
  settings,
  roles,
  options,
  limitations,
}: TeamManagementSettingsFormProps) {
  const router = useRouter();
  const [values, setValues] =
    useState<TeamManagementSettingsValues>(settings);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateValue<Key extends keyof TeamManagementSettingsValues>(
    key: Key,
    value: TeamManagementSettingsValues[Key]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function saveSettings() {
    setError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateTeamManagementSettingsAction(values);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setMessage("Team management settings saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <SettingsCard
        icon={ShieldCheck}
        title="General"
        description="Configure general preferences for your team."
      >
        <div className="divide-y divide-slate-100">
          <SelectRow
            label="Default Role for New Members"
            description="Choose the default role assigned to new members."
            value={values.default_role_id ?? ""}
            onChange={(value) => updateValue("default_role_id", value || null)}
            options={[
              { value: "", label: "No default role" },
              ...roles.map((role) => ({ value: role.id, label: role.name })),
            ]}
          />
          <SelectRow
            label="Auto-assign Department"
            description="Automatically assign new members to a department."
            value={values.auto_assign_department_mode}
            onChange={(value) =>
              updateValue(
                "auto_assign_department_mode",
                value as TeamManagementSettingsValues["auto_assign_department_mode"]
              )
            }
            options={options.autoAssignDepartmentModes.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <ToggleRow
            label="Enable Invite Approval"
            description="Require admin approval before new members can join."
            checked={values.invite_approval_enabled}
            onChange={(checked) =>
              updateValue("invite_approval_enabled", checked)
            }
          />
          <TextRow
            label="Team Time Zone"
            description="Set the default time zone for the entire team."
            value={values.team_timezone}
            onChange={(value) => updateValue("team_timezone", value)}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={KeyRound}
        title="Access & Permissions"
        description="Control how team members can access and manage data."
      >
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="Allow Managers to Invite Members"
            description="Enable managers to invite new members to their teams."
            checked={values.allow_managers_invite_members}
            onChange={(checked) =>
              updateValue("allow_managers_invite_members", checked)
            }
          />
          <ToggleRow
            label="Allow Team Leads to Create Projects"
            description="Team leads can create and manage projects."
            checked={values.allow_team_leads_create_projects}
            onChange={(checked) =>
              updateValue("allow_team_leads_create_projects", checked)
            }
          />
          <ToggleRow
            label="Restrict Data Access by Department"
            description="Members can only access data from their own department."
            checked={values.restrict_data_access_by_department}
            onChange={(checked) =>
              updateValue("restrict_data_access_by_department", checked)
            }
          />
          <ToggleRow
            label="Role Inheritance"
            description="Allow roles to inherit permissions from parent roles."
            checked={values.role_inheritance_enabled}
            onChange={(checked) =>
              updateValue("role_inheritance_enabled", checked)
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={UsersRound}
        title="Member Onboarding"
        description="Customize the onboarding experience for new members."
      >
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="Send Welcome Email"
            description={limitations.send_welcome_email}
            checked={values.send_welcome_email}
            onChange={(checked) => updateValue("send_welcome_email", checked)}
          />
          <ToggleRow
            label="Require Profile Completion"
            description="Ask new members to complete their profile before accessing."
            checked={values.require_profile_completion}
            onChange={(checked) =>
              updateValue("require_profile_completion", checked)
            }
          />
          <ToggleRow
            label="Onboarding Checklist"
            description="Show onboarding checklist to new members."
            checked={values.onboarding_checklist_enabled}
            onChange={(checked) =>
              updateValue("onboarding_checklist_enabled", checked)
            }
          />
          <SelectRow
            label="Default Onboarding Department"
            description="Select department for new members during onboarding."
            value={values.default_onboarding_department ?? ""}
            onChange={(value) =>
              updateValue(
                "default_onboarding_department",
                (value || null) as TeamManagementSettingsValues["default_onboarding_department"]
              )
            }
            options={[
              { value: "", label: "Select department" },
              ...options.departments.map((value) => ({
                value,
                label: formatLabel(value),
              })),
            ]}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={GitBranch}
        title="Work & Approvals"
        description="Configure workflows, approvals, and escalation rules."
      >
        <div className="divide-y divide-slate-100">
          <SelectRow
            label="Approval Workflow"
            description={limitations.approval_workflow}
            value={values.approval_workflow}
            onChange={(value) =>
              updateValue(
                "approval_workflow",
                value as TeamManagementSettingsValues["approval_workflow"]
              )
            }
            options={options.approvalWorkflows.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <SelectRow
            label="Default Approval Chain"
            description="Set default approval chain for requests."
            value={values.default_approval_chain}
            onChange={(value) =>
              updateValue(
                "default_approval_chain",
                value as TeamManagementSettingsValues["default_approval_chain"]
              )
            }
            options={options.approvalChains.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <NumberRow
            label="Escalation Rule"
            description="Escalate pending approvals after this many hours."
            value={values.escalation_hours}
            onChange={(value) => updateValue("escalation_hours", value)}
          />
          <ToggleRow
            label="Auto-approve for Admins"
            description="Admins can auto-approve requests."
            checked={values.auto_approve_admins}
            onChange={(checked) => updateValue("auto_approve_admins", checked)}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Bell}
        title="Notifications"
        description="Manage team-related notification preferences."
      >
        <div className="divide-y divide-slate-100">
          <ToggleRow
            label="New Member Invite Alerts"
            description="Notify admins when new invitations are sent."
            checked={values.new_member_invite_alerts}
            onChange={(checked) =>
              updateValue("new_member_invite_alerts", checked)
            }
          />
          <ToggleRow
            label="Role Change Alerts"
            description="Notify when a member's role is changed."
            checked={values.role_change_alerts}
            onChange={(checked) => updateValue("role_change_alerts", checked)}
          />
          <ToggleRow
            label="Department Assignment Alerts"
            description="Notify when members are added to a department."
            checked={values.department_assignment_alerts}
            onChange={(checked) =>
              updateValue("department_assignment_alerts", checked)
            }
          />
          <ToggleRow
            label="Member Deactivation Alerts"
            description="Notify when a member is deactivated."
            checked={values.member_deactivation_alerts}
            onChange={(checked) =>
              updateValue("member_deactivation_alerts", checked)
            }
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={SlidersHorizontal}
        title="Team Preference"
        description="Set preference for how team data and interface behaves."
      >
        <div className="divide-y divide-slate-100">
          <SelectRow
            label="Default View for Members"
            description="Choose default view when opening members list."
            value={values.default_member_view}
            onChange={(value) =>
              updateValue(
                "default_member_view",
                value as TeamManagementSettingsValues["default_member_view"]
              )
            }
            options={options.defaultMemberViews.map((value) => ({
              value,
              label: `${formatLabel(value)} View`,
            }))}
          />
          <SelectRow
            label="Items Per Page"
            description="Set number of items displayed per page."
            value={String(values.items_per_page)}
            onChange={(value) =>
              updateValue(
                "items_per_page",
                Number(value) as TeamManagementSettingsValues["items_per_page"]
              )
            }
            options={options.itemsPerPage.map((value) => ({
              value: String(value),
              label: String(value),
            }))}
          />
          <SelectRow
            label="Date Format"
            description="Set default date format for team module."
            value={values.date_format}
            onChange={(value) =>
              updateValue(
                "date_format",
                value as TeamManagementSettingsValues["date_format"]
              )
            }
            options={options.dateFormats.map((value) => ({
              value,
              label: value,
            }))}
          />
          <ToggleRow
            label="Show Online Status"
            description="Display online status of team members."
            checked={values.show_online_status}
            onChange={(checked) => updateValue("show_online_status", checked)}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={ShieldCheck}
        title="Data & Visibility"
        description="Control visibility and access to team data."
      >
        <div className="divide-y divide-slate-100">
          <SelectRow
            label="Who Can View Salary Information"
            description="Control who can view member salary information."
            value={values.salary_visibility}
            onChange={(value) =>
              updateValue(
                "salary_visibility",
                value as TeamManagementSettingsValues["salary_visibility"]
              )
            }
            options={options.salaryVisibilityOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <SelectRow
            label="Department Visibility"
            description="Control who can view other departments."
            value={values.department_visibility}
            onChange={(value) =>
              updateValue(
                "department_visibility",
                value as TeamManagementSettingsValues["department_visibility"]
              )
            }
            options={options.departmentVisibilityOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <ToggleRow
            label="Hide Inactive Members"
            description="Hide inactive members from lists by default."
            checked={values.hide_inactive_members}
            onChange={(checked) => updateValue("hide_inactive_members", checked)}
          />
          <SelectRow
            label="Data Export Permission"
            description="Allow members to export team data."
            value={values.data_export_permission}
            onChange={(value) =>
              updateValue(
                "data_export_permission",
                value as TeamManagementSettingsValues["data_export_permission"]
              )
            }
            options={options.dataExportPermissionOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Link2}
        title="Integrations"
        description="Manage integration readiness for the team module."
      >
        <div className="divide-y divide-slate-100">
          <SelectRow
            label="Directory Sync"
            description={limitations.directory_sync_status}
            value={values.directory_sync_status}
            onChange={(value) =>
              updateValue(
                "directory_sync_status",
                value as TeamManagementSettingsValues["directory_sync_status"]
              )
            }
            options={options.integrationStatusOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <SelectRow
            label="SSO"
            description={limitations.sso_status}
            value={values.sso_status}
            onChange={(value) =>
              updateValue(
                "sso_status",
                value as TeamManagementSettingsValues["sso_status"]
              )
            }
            options={options.integrationStatusOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <SelectRow
            label="Webhooks"
            description={limitations.webhooks_status}
            value={values.webhooks_status}
            onChange={(value) =>
              updateValue(
                "webhooks_status",
                value as TeamManagementSettingsValues["webhooks_status"]
              )
            }
            options={options.integrationStatusOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
          <SelectRow
            label="API Access"
            description={limitations.api_access_status}
            value={values.api_access_status}
            onChange={(value) =>
              updateValue(
                "api_access_status",
                value as TeamManagementSettingsValues["api_access_status"]
              )
            }
            options={options.integrationStatusOptions.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
        </div>
      </SettingsCard>

      <div className="sticky bottom-0 z-10 flex flex-wrap justify-end gap-3 border-t border-slate-200/70 bg-white/90 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setValues(settings)}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={saveSettings}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--bytech-accent)] px-5 text-sm font-black text-white shadow-lg shadow-indigo-200/80 transition hover:bg-[#4338CA] disabled:opacity-60"
        >
          <Save className="size-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-indigo-100/70 bg-white p-4 shadow-sm shadow-indigo-100/60">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-black text-[#111827]">{title}</h2>
          <p className="mt-1 text-[13px] font-medium leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SelectRow({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div>
        <p className="text-sm font-black text-[#111827]">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div>
        <p className="text-sm font-black text-[#111827]">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function NumberRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div>
        <p className="text-sm font-black text-[#111827]">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <input
        type="number"
        min={1}
        max={720}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClassName}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_64px] md:items-center">
      <div>
        <p className="text-sm font-black text-[#111827]">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 rounded-full transition",
          checked ? "bg-[var(--bytech-accent)]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-1 flex size-5 items-center justify-center rounded-full bg-white text-[var(--bytech-accent)] shadow transition",
            checked ? "left-6" : "left-1"
          )}
        >
          {checked ? <Check className="size-3" /> : null}
        </span>
      </button>
    </div>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "success" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-bold",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {children}
    </div>
  );
}

const inputClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
