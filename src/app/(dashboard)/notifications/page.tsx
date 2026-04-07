import { createClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      title,
      message,
      related_table,
      related_id,
      is_read,
      created_at
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Notifications
        </h2>
        <p className="text-slate-600">
          Track reminders, assignments, and system updates.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load notifications: {error.message}
        </div>
      ) : (
        <NotificationList notifications={notifications || []} />
      )}
    </div>
  );
}