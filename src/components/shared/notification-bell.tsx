import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export async function NotificationBell() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const unreadCount = count || 0;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50"
    >
      <Bell className="h-4 w-4 text-slate-700" />
      {unreadCount > 0 ? (
        <Badge className="absolute -right-2 -top-2 min-w-5 px-1.5 py-0 text-[10px]">
          {unreadCount}
        </Badge>
      ) : null}
    </Link>
  );
}