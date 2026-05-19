import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireModule } from "@/lib/auth/require-module";
import { formatUserDateTime } from "@/lib/preferences/format";
import {
  getCurrentUserPreferences,
  getUserItemsPerPage,
} from "@/lib/preferences/user-preferences";
import {
  SettingsMetric,
  SettingsRailCard,
  SettingsSection,
  SettingsWorkspace,
  StatusPill,
} from "@/components/settings/settings-workspace";

type AuditLogRow = {
  id: string;
  entity_type: string;
  action: string;
  description: string | null;
  created_at: string;
  actor: { full_name: string | null } | null;
};

export default async function SettingsAuditLogsPage() {
  await requireModule("audit-logs");
  const profile = await requireAdmin();
  const preferences = await getCurrentUserPreferences(profile.id);
  const itemsPerPage = getUserItemsPerPage(preferences);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      id,
      entity_type,
      action,
      description,
      created_at,
      actor:profiles!activity_logs_actor_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(itemsPerPage);

  const logs = (data ?? []) as AuditLogRow[];

  return (
    <SettingsWorkspace
      active="audit"
      title="Audit Logs"
      description="Review system-wide operational activity recorded in the existing activity log table."
      isAdmin={profile.role === "admin"}
      rightRail={
        <>
          <SettingsRailCard title="Audit Summary">
            <div className="space-y-3">
              <SettingsMetric label="Loaded Entries" value={String(logs.length)} />
              <SettingsMetric
                label="Access"
                value="Admin"
                tone="success"
              />
            </div>
          </SettingsRailCard>
          <SettingsRailCard title="Legacy Route">
            <p className="text-sm leading-6 text-slate-500">
              The existing audit page remains available for backward
              compatibility.
            </p>
            <Link
              href="/audit-logs"
              className="mt-3 inline-flex rounded-2xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-[#4F46E5]"
            >
              Open classic audit logs
            </Link>
          </SettingsRailCard>
        </>
      }
    >
      <SettingsSection title="Recent Audit Activity">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load audit logs: {error.message}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-indigo-100">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-indigo-50/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Entity</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Actor</th>
                  <th className="px-3 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/70 bg-white">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-3">
                      <StatusPill>{log.action.replaceAll("_", " ")}</StatusPill>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#111827]">
                      {log.entity_type.replaceAll("_", " ")}
                    </td>
                    <td className="max-w-[420px] truncate px-3 py-3 text-slate-600">
                      {log.description ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {log.actor?.full_name ?? "System"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {formatUserDateTime(log.created_at, preferences)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSection>
    </SettingsWorkspace>
  );
}
