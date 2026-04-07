import { startOfDay, endOfDay } from "date-fns";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TasksDueToday } from "@/components/dashboard/tasks-due-today";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Invoice, Payment, Task, Activity } from "@/types";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.rpc("mark_overdue_invoices");

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  const [
    leadsResult,
    customersResult,
    invoicesResult,
    paymentsResult,
    tasksDueTodayResult,
    activityResult,
  ] = await Promise.all([
    profile.role === "admin"
      ? supabase.from("leads").select("id", { count: "exact", head: true })
      : supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .or(`assigned_to.eq.${profile.id},created_by.eq.${profile.id}`),

    profile.role === "admin"
      ? supabase.from("customers").select("id", { count: "exact", head: true })
      : supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .or(`account_manager_id.eq.${profile.id},created_by.eq.${profile.id}`),

    supabase.from("payment_invoices").select("id, status"),

    supabase.from("payment_transactions").select("amount, paid_at"),

    profile.role === "admin"
      ? supabase
          .from("tasks")
          .select(`
            id,
            title,
            status,
            priority,
            due_date,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
          `)
          .gte("due_date", todayStart)
          .lte("due_date", todayEnd)
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(10)
      : supabase
          .from("tasks")
          .select(`
            id,
            title,
            status,
            priority,
            due_date,
            assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
          `)
          .eq("assigned_to", profile.id)
          .gte("due_date", todayStart)
          .lte("due_date", todayEnd)
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(10),

    supabase
      .from("activity_logs")
      .select(`
        id,
        action,
        description,
        entity_type,
        created_at,
        actor:profiles!activity_logs_actor_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // ✅ CAST TYPES
  const invoices = (invoicesResult.data ?? []) as Invoice[];
  const payments = (paymentsResult.data ?? []) as Payment[];
  const tasks = (tasksDueTodayResult.data ?? []) as Task[];
  const activities = (activityResult.data ?? []) as Activity[];

  const pendingInvoices =
    invoices.filter(
      (invoice) => invoice.status === "pending" || invoice.status === "partial"
    ).length;

  const overdueInvoices =
    invoices.filter((invoice) => invoice.status === "overdue").length;

  const todayRevenue =
    payments
      .filter((payment) => {
        const paidAt = new Date(payment.paid_at).getTime();
        return (
          paidAt >= new Date(todayStart).getTime() &&
          paidAt <= new Date(todayEnd).getTime()
        );
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h2>
        <p className="text-slate-600">
          Welcome back, {profile.full_name}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          title="Total Leads"
          value={String(leadsResult.count || 0)}
        />
        <StatsCard
          title="Total Customers"
          value={String(customersResult.count || 0)}
        />
        <StatsCard
          title="Revenue Today"
          value={formatCurrency(todayRevenue)}
        />
        <StatsCard
          title="Pending Invoices"
          value={String(pendingInvoices)}
        />
        <StatsCard
          title="Overdue Invoices"
          value={String(overdueInvoices)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksDueToday tasks={tasks as any} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}