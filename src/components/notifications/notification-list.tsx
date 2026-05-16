"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bell, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNotificationHref } from "@/lib/notifications/notification-links";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  related_table: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationListProps = {
  notifications: NotificationItem[];
};

export function NotificationList({
  notifications,
}: NotificationListProps) {
  const [isPending, startTransition] = useTransition();
  const [bulkPending, startBulkTransition] = useTransition();
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const unreadNotifications = notifications.filter((item) => !item.is_read);
  const readNotifications = notifications.filter((item) => item.is_read);

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <Bell className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          No notifications yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Important CRM updates will appear here when they need your attention.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            Notification inbox
          </span>
          <Badge variant={unreadCount > 0 ? "default" : "outline"}>
            {unreadCount} unread
          </Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={bulkPending || unreadCount === 0}
          onClick={() => {
            setError("");

            startBulkTransition(async () => {
              const result = await markAllNotificationsAsReadAction();

              if ("error" in result) {
                setError(result.error);
              }
            });
          }}
        >
          {bulkPending ? "Updating..." : "Mark all as read"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {unreadNotifications.length > 0 ? (
        <NotificationGroup title="Needs attention">
          {unreadNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isPending={isPending}
              onMarkRead={() => {
                setError("");

                startTransition(async () => {
                  const result = await markNotificationAsReadAction(notification.id);

                  if ("error" in result) {
                    setError(result.error);
                  }
                });
              }}
            />
          ))}
        </NotificationGroup>
      ) : null}

      {readNotifications.length > 0 ? (
        <NotificationGroup title="Earlier">
          {readNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isPending={isPending}
              onMarkRead={() => undefined}
            />
          ))}
        </NotificationGroup>
      ) : null}
    </div>
  );
}

function NotificationGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function NotificationCard({
  notification,
  isPending,
  onMarkRead,
}: {
  notification: NotificationItem;
  isPending: boolean;
  onMarkRead: () => void;
}) {
  const href = getNotificationHref(
    notification.related_table,
    notification.related_id
  );

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        notification.is_read
          ? "border-slate-200 bg-white"
          : "border-blue-200 bg-blue-50/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {notification.is_read ? (
              <CheckCircle2 className="h-4 w-4 text-slate-300" />
            ) : (
              <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
            )}
            <p className="text-sm font-semibold text-slate-900">
              {notification.title}
            </p>
            <Badge variant="outline" className="capitalize">
              {notification.type}
            </Badge>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {notification.message || "Open notification details."}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>
              Open
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </Button>

          {!notification.is_read ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={onMarkRead}
            >
              {isPending ? "Please wait..." : "Mark read"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
