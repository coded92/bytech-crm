import { formatDateTime } from "@/lib/utils/format-date";

type ActivityItem = {
  id: string;
  action: string;
  description: string;
  entity_type: string;
  created_at: string;
  actor?: {
    full_name: string | null;
  } | null;
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        No recent activity.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium capitalize text-slate-900">
              {activity.entity_type.replaceAll("_", " ")} ·{" "}
              {activity.action.replaceAll("_", " ")}
            </p>
            <p className="text-xs text-slate-500">
              {formatDateTime(activity.created_at)}
            </p>
          </div>

          <p className="mt-2 text-sm text-slate-600">{activity.description}</p>

          <p className="mt-2 text-xs text-slate-500">
            By: {activity.actor?.full_name || "Unknown user"}
          </p>
        </div>
      ))}
    </div>
  );
}