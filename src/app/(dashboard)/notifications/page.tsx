import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotificationRow = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  related_table: string | null;
  related_id: string | null;
  created_at: string;
};

type TaskAlertRow = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
};

type LeadAlertRow = {
  id: string;
  company_name: string;
  next_follow_up_at: string | null;
  status: string;
};

type InvoiceAlertRow = {
  id: string;
  invoice_number: string;
  due_date: string | null;
  balance_due: number;
  status: string;
};

type SupportAlertRow = {
  id: string;
  title: string;
  priority: string;
  status: string;
};

type FieldJobAlertRow = {
  id: string;
  job_number: string;
  title: string;
  scheduled_date: string | null;
  status: string;
};

function getLink(table: string | null, id: string | null) {
  if (!table || !id) return null;

  if (table === "tasks") return `/tasks/${id}`;
  if (table === "leads") return `/leads/${id}`;
  if (table === "invoices") return `/payments/invoices/${id}`;
  if (table === "support_tickets") return `/support/${id}`;
  if (table === "field_jobs") return `/field-jobs/${id}`;

  return null;
}

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);

  const [
    { data: notificationsData, error: notificationsError },
    { data: tasksDueTodayData },
    { data: overdueTasksData },
    { data: leadsDueTodayData },
    { data: overdueLeadsData },
    { data: overdueInvoicesData },
    { data: urgentSupportData },
    { data: fieldJobsDueTodayData },
    { data: overdueFieldJobsData },
  ] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, message, type, is_read, related_table, related_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),

    supabase
      .from("tasks")
      .select("id, title, due_date, status")
      .eq("assigned_to", user.id)
      .eq("status", "pending")
      .gte("due_date", `${todayDate}T00:00:00`)
      .lte("due_date", `${todayDate}T23:59:59`),

    supabase
      .from("tasks")
      .select("id, title, due_date, status")
      .eq("assigned_to", user.id)
      .in("status", ["pending", "in_progress"])
      .lt("due_date", `${todayDate}T00:00:00`),

    supabase
      .from("leads")
      .select("id, company_name, next_follow_up_at, status")
      .eq("assigned_to", user.id)
      .gte("next_follow_up_at", `${todayDate}T00:00:00`)
      .lte("next_follow_up_at", `${todayDate}T23:59:59`),

    supabase
      .from("leads")
      .select("id, company_name, next_follow_up_at, status")
      .eq("assigned_to", user.id)
      .lt("next_follow_up_at", `${todayDate}T00:00:00`)
      .in("status", ["new", "contacted", "interested", "follow_up"]),

    supabase
      .from("invoices")
      .select("id, invoice_number, due_date, balance_due, status")
      .neq("status", "paid")
      .lt("due_date", todayDate),

    supabase
      .from("support_tickets")
      .select("id, title, priority, status")
      .eq("assigned_to", user.id)
      .eq("priority", "urgent")
      .in("status", ["open", "in_progress"]),

    supabase
      .from("field_jobs")
      .select("id, job_number, title, scheduled_date, status")
      .eq("assigned_engineer_id", user.id)
      .eq("scheduled_date", todayDate)
      .in("status", ["pending", "assigned", "in_progress", "awaiting_parts"]),

    supabase
      .from("field_jobs")
      .select("id, job_number, title, scheduled_date, status")
      .eq("assigned_engineer_id", user.id)
      .lt("scheduled_date", todayDate)
      .in("status", ["pending", "assigned", "in_progress", "awaiting_parts"]),
  ]);

  const notifications = (notificationsData ?? []) as NotificationRow[];
  const tasksDueToday = (tasksDueTodayData ?? []) as TaskAlertRow[];
  const overdueTasks = (overdueTasksData ?? []) as TaskAlertRow[];
  const leadsDueToday = (leadsDueTodayData ?? []) as LeadAlertRow[];
  const overdueLeads = (overdueLeadsData ?? []) as LeadAlertRow[];
  const overdueInvoices = (overdueInvoicesData ?? []) as InvoiceAlertRow[];
  const urgentSupport = (urgentSupportData ?? []) as SupportAlertRow[];
  const fieldJobsDueToday = (fieldJobsDueTodayData ?? []) as FieldJobAlertRow[];
  const overdueFieldJobs = (overdueFieldJobsData ?? []) as FieldJobAlertRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Alert Center
        </h2>
        <p className="text-slate-600">
          Important reminders, overdue items, and system notifications.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Tasks Due Today" value={String(tasksDueToday.length)} />
        <SummaryCard label="Overdue Tasks" value={String(overdueTasks.length)} />
        <SummaryCard label="Lead Follow-ups Today" value={String(leadsDueToday.length)} />
        <SummaryCard label="Overdue Lead Follow-ups" value={String(overdueLeads.length)} />
        <SummaryCard label="Overdue Invoices" value={String(overdueInvoices.length)} />
        <SummaryCard label="Urgent Support Tickets" value={String(urgentSupport.length)} />
        <SummaryCard label="Field Jobs Today" value={String(fieldJobsDueToday.length)} />
        <SummaryCard label="Overdue Field Jobs" value={String(overdueFieldJobs.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Smart Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <AlertGroup title="Tasks Due Today">
            {tasksDueToday.length === 0 ? (
              <EmptyText text="No tasks due today." />
            ) : (
              tasksDueToday.map((task) => (
                <AlertItem
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  title={task.title}
                  meta={`Due: ${formatDateTime(task.due_date)}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Overdue Tasks">
            {overdueTasks.length === 0 ? (
              <EmptyText text="No overdue tasks." />
            ) : (
              overdueTasks.map((task) => (
                <AlertItem
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  title={task.title}
                  meta={`Due: ${formatDateTime(task.due_date)}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Lead Follow-ups Due Today">
            {leadsDueToday.length === 0 ? (
              <EmptyText text="No lead follow-ups due today." />
            ) : (
              leadsDueToday.map((lead) => (
                <AlertItem
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  title={lead.company_name}
                  meta={`Follow-up: ${formatDateTime(lead.next_follow_up_at)}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Overdue Lead Follow-ups">
            {overdueLeads.length === 0 ? (
              <EmptyText text="No overdue lead follow-ups." />
            ) : (
              overdueLeads.map((lead) => (
                <AlertItem
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  title={lead.company_name}
                  meta={`Follow-up: ${formatDateTime(lead.next_follow_up_at)}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Overdue Invoices">
            {overdueInvoices.length === 0 ? (
              <EmptyText text="No overdue invoices." />
            ) : (
              overdueInvoices.map((invoice) => (
                <AlertItem
                  key={invoice.id}
                  href={`/payments/invoices/${invoice.id}`}
                  title={invoice.invoice_number}
                  meta={`Due: ${formatDate(invoice.due_date)} · Balance: ${invoice.balance_due}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Urgent Support Tickets">
            {urgentSupport.length === 0 ? (
              <EmptyText text="No urgent support tickets." />
            ) : (
              urgentSupport.map((ticket) => (
                <AlertItem
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  title={ticket.title}
                  meta={`Priority: ${ticket.priority}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Field Jobs Due Today">
            {fieldJobsDueToday.length === 0 ? (
              <EmptyText text="No field jobs due today." />
            ) : (
              fieldJobsDueToday.map((job) => (
                <AlertItem
                  key={job.id}
                  href={`/field-jobs/${job.id}`}
                  title={`${job.job_number} - ${job.title}`}
                  meta={`Scheduled: ${formatDate(job.scheduled_date)}`}
                />
              ))
            )}
          </AlertGroup>

          <AlertGroup title="Overdue Field Jobs">
            {overdueFieldJobs.length === 0 ? (
              <EmptyText text="No overdue field jobs." />
            ) : (
              overdueFieldJobs.map((job) => (
                <AlertItem
                  key={job.id}
                  href={`/field-jobs/${job.id}`}
                  title={`${job.job_number} - ${job.title}`}
                  meta={`Scheduled: ${formatDate(job.scheduled_date)}`}
                />
              ))
            )}
          </AlertGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationsError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              Failed to load notifications: {notificationsError.message}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyText text="No notifications yet." />
          ) : (
            notifications.map((notification) => {
              const href = getLink(
                notification.related_table,
                notification.related_id
              );

              const content = (
                <div
                  className={`rounded-xl border p-4 ${
                    notification.is_read
                      ? "border-slate-200 bg-white"
                      : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {notification.message || "-"}
                      </p>
                      <p className="mt-2 text-xs capitalize text-slate-400">
                        {notification.type.replaceAll("_", " ")}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              );

              return href ? (
                <Link key={notification.id} href={href} className="block">
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function AlertGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AlertItem({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
    >
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{meta}</p>
    </Link>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-sm text-slate-500">{text}</p>;
}