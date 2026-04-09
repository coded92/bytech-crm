import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditLogsPageProps = {
  searchParams: Promise<{
    entity_type?: string;
    action?: string;
  }>;
};

type AuditLogRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string | null;
  created_at: string;
  actor: {
    full_name: string | null;
  } | null;
};

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  await requireAdmin();
  const { entity_type, action } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select(`
      id,
      entity_type,
      entity_id,
      action,
      description,
      created_at,
      actor:profiles!activity_logs_actor_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (entity_type) {
    query = query.eq("entity_type", entity_type);
  }

  if (action) {
    query = query.eq("action", action);
  }

  const { data, error } = await query;
  const logs = (data ?? []) as AuditLogRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Audit Logs
        </h2>
        <p className="text-slate-600">
          Track who changed what across the system.
        </p>
      </div>

      <form
        action="/audit-logs"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="space-y-2">
          <label
            htmlFor="entity_type"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Entity Type
          </label>
          <input
            id="entity_type"
            name="entity_type"
            defaultValue={entity_type || ""}
            placeholder="e.g. support_ticket"
            className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="action"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Action
          </label>
          <input
            id="action"
            name="action"
            defaultValue={action || ""}
            placeholder="e.g. created"
            className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
        >
          Apply Filter
        </button>

        <a
          href="/audit-logs"
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700"
        >
          Reset
        </a>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Failed to load audit logs: {error.message}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500">No audit logs found.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {log.description || `${log.entity_type} ${log.action}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {log.entity_type} · {log.action} · ID: {log.entity_id}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        By: {log.actor?.full_name || "Unknown user"}
                      </p>
                    </div>

                    <p className="text-sm text-slate-500">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}