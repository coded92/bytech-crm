"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/lib/actions/notifications";
import { formatDateTime } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  type: "task" | "lead" | "payment" | "system" | "quotation";
  title: string;
  message: string;
  related_table: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationListProps = {
  notifications: NotificationItem[];
};

function getNotificationHref(
  relatedTable: string | null,
  relatedId: string | null
) {
  if (!relatedTable || !relatedId) return "/notifications";

  if (relatedTable === "tasks") return `/tasks/${relatedId}`;
  if (relatedTable === "leads") return `/leads/${relatedId}`;
  if (relatedTable === "quotations") return `/quotations/${relatedId}`;
  if (relatedTable === "payment_invoices") return `/payments/invoices/${relatedId}`;
  if (relatedTable === "receipts") return `/payments/receipts/${relatedId}`;

  return "/notifications";
}

export function NotificationList({
  notifications,
}: NotificationListProps) {
  const [isPending, startTransition] = useTransition();
  const [bulkPending, startBulkTransition] = useTransition();
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No notifications found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Unread:</span>
          <Badge>{unreadCount}</Badge>
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

      {notifications.map((notification) => {
        const href = getNotificationHref(
          notification.related_table,
          notification.related_id
        );

        return (
          <div
            key={notification.id}
            className={`rounded-xl border p-4 ${
              notification.is_read
                ? "border-slate-200 bg-white"
                : "border-blue-200 bg-blue-50/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {notification.title}
                  </p>
                  {!notification.is_read ? (
                    <Badge className="bg-blue-600 text-white">New</Badge>
                  ) : null}
                  <Badge variant="outline" className="capitalize">
                    {notification.type}
                  </Badge>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  {notification.message}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {formatDateTime(notification.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={href}>Open</Link>
                </Button>

                {!notification.is_read ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => {
                      setError("");

                      startTransition(async () => {
                        const result = await markNotificationAsReadAction(
                          notification.id
                        );

                        if ("error" in result) {
                          setError(result.error);
                        }
                      });
                    }}
                  >
                    {isPending ? "Please wait..." : "Mark read"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}