import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  Pencil,
  Plus,
  User,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type ActivityItem = {
  id: string;
  action: string;
  description: string | null;
  entity_type: string;
  entity_id?: string | null;
  created_at: string;
  actor?: {
    full_name: string | null;
  } | null;
};

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/80 p-8 text-center shadow-sm shadow-indigo-50">
        <Bell className="mx-auto h-6 w-6 text-violet-300" />
        <p className="mt-3 text-sm font-medium text-slate-900">
          No recent activity
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Updates will appear here as your team works across the CRM.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const meta = getActivityMeta(activity.entity_type, activity.action);
        const Icon = meta.icon;
        const href = getActivityHref(activity.entity_type, activity.entity_id);
        const content = (
          <div className="rounded-3xl border border-white/80 bg-white/84 p-4 shadow-sm shadow-indigo-100/50 transition hover:border-indigo-100 hover:bg-white">
            <div className="flex gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {activity.description || `${meta.entityLabel} ${meta.actionLabel}`}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {meta.entityLabel}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {meta.actionLabel} by {activity.actor?.full_name || "Unknown user"}
                </p>
              </div>
            </div>
          </div>
        );

        return href ? (
          <Link key={activity.id} href={href} className="block">
            {content}
          </Link>
        ) : (
          <div key={activity.id}>{content}</div>
        );
      })}
    </div>
  );
}

function getActivityMeta(entityType: string, action: string) {
  const normalizedEntity = entityType.replaceAll("_", " ");
  const normalizedAction = action.replaceAll("_", " ");

  const entityMap: Record<
    string,
    {
      entityLabel: string;
      icon: typeof Building2;
      iconClass: string;
    }
  > = {
    customer: {
      entityLabel: "Customer",
      icon: Building2,
      iconClass: "bg-blue-50 text-blue-700",
    },
    lead: {
      entityLabel: "Lead",
      icon: User,
      iconClass: "bg-amber-50 text-amber-700",
    },
    task: {
      entityLabel: "Task",
      icon: CheckCircle2,
      iconClass: "bg-sky-50 text-sky-700",
    },
    quotation: {
      entityLabel: "Quotation",
      icon: FileText,
      iconClass: "bg-violet-50 text-violet-700",
    },
    invoice: {
      entityLabel: "Invoice",
      icon: CreditCard,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    payment: {
      entityLabel: "Payment",
      icon: CreditCard,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    support_ticket: {
      entityLabel: "Support",
      icon: Wrench,
      iconClass: "bg-rose-50 text-rose-700",
    },
    field_job: {
      entityLabel: "Field Job",
      icon: Wrench,
      iconClass: "bg-cyan-50 text-cyan-700",
    },
    project: {
      entityLabel: "Project",
      icon: BriefcaseBusiness,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    project_task: {
      entityLabel: "Project Task",
      icon: CheckCircle2,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    project_member: {
      entityLabel: "Project Member",
      icon: User,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    inventory: {
      entityLabel: "Inventory",
      icon: Package,
      iconClass: "bg-slate-100 text-slate-700",
    },
    inventory_item: {
      entityLabel: "Inventory",
      icon: Package,
      iconClass: "bg-slate-100 text-slate-700",
    },
    supplier: {
      entityLabel: "Supplier",
      icon: Building2,
      iconClass: "bg-orange-50 text-orange-700",
    },
    asset: {
      entityLabel: "Asset",
      icon: Package,
      iconClass: "bg-slate-100 text-slate-700",
    },
    user: {
      entityLabel: "User",
      icon: User,
      iconClass: "bg-purple-50 text-purple-700",
    },
    expense: {
      entityLabel: "Expense",
      icon: CreditCard,
      iconClass: "bg-red-50 text-red-700",
    },
    daily_report: {
      entityLabel: "Report",
      icon: FileText,
      iconClass: "bg-teal-50 text-teal-700",
    },
    deployment: {
      entityLabel: "Deployment",
      icon: BriefcaseBusiness,
      iconClass: "bg-indigo-50 text-indigo-700",
    },
    restock_order: {
      entityLabel: "Restock",
      icon: Package,
      iconClass: "bg-orange-50 text-orange-700",
    },
  };

  const actionMap: Record<string, { actionLabel: string; icon?: typeof Plus }> = {
    created: { actionLabel: "Created", icon: Plus },
    updated: { actionLabel: "Updated", icon: Pencil },
    status_updated: { actionLabel: "Status updated", icon: CheckCircle2 },
    deleted: { actionLabel: "Deleted", icon: Pencil },
  };

  const entity = entityMap[entityType] || {
    entityLabel: normalizedEntity,
    icon: Bell,
    iconClass: "bg-slate-100 text-slate-700",
  };
  const actionMeta = actionMap[action] || { actionLabel: normalizedAction };

  return {
    ...entity,
    actionLabel: actionMeta.actionLabel,
  };
}

function getActivityHref(entityType: string, entityId?: string | null) {
  if (!entityId) return null;

  if (entityType === "customer") return `/customers/${entityId}`;
  if (entityType === "lead") return `/leads/${entityId}`;
  if (entityType === "task") return `/tasks/${entityId}`;
  if (entityType === "quotation") return `/quotations/${entityId}`;
  if (entityType === "invoice" || entityType === "payment") {
    return `/payments/invoices/${entityId}`;
  }
  if (entityType === "support_ticket") return `/support/${entityId}`;
  if (entityType === "field_job") return `/field-jobs/${entityId}`;
  if (entityType === "project") return `/projects/${entityId}`;
  if (entityType === "asset") return `/assets/${entityId}`;
  if (entityType === "supplier") return `/suppliers/${entityId}`;
  if (entityType === "user") return `/users/${entityId}`;
  if (entityType === "daily_report") return `/reports/${entityId}`;
  if (entityType === "deployment") return `/deployments/${entityId}`;
  if (entityType === "restock_order") return `/restocking/${entityId}`;

  return null;
}
