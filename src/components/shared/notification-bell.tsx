import Link from "next/link";
import { Bell, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotificationHref } from "@/lib/notifications/notification-links";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type NotificationPreview = {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  related_table: string | null;
  related_id: string | null;
  created_at: string;
};

export async function NotificationBell() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id, title, message, is_read, related_table, related_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const unreadCount = count || 0;
  const notifications = (data ?? []) as NotificationPreview[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4 text-slate-700" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-2 -top-2 min-w-5 px-1.5 py-0 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[340px] p-2">
        <DropdownMenuLabel className="flex items-center justify-between px-2 py-2">
          <span className="font-semibold text-slate-900">Notifications</span>
          <span className="text-xs font-normal text-slate-500">
            {unreadCount} unread
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild className="p-0">
              <Link
                href={getNotificationHref(
                  notification.related_table,
                  notification.related_id
                )}
                className="flex gap-3 rounded-lg px-3 py-3"
              >
                <Circle
                  className={`mt-1 h-2.5 w-2.5 shrink-0 ${
                    notification.is_read
                      ? "fill-slate-200 text-slate-200"
                      : "fill-blue-600 text-blue-600"
                  }`}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">
                    {notification.message || "Open notification details"}
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="justify-center">
          <Link href="/notifications" className="w-full text-center font-medium">
            View notification center
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
