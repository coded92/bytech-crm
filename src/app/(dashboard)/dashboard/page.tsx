import { startOfDay, endOfDay } from "date-fns";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TasksDueToday } from "@/components/dashboard/tasks-due-today";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunReminderScanButton } from "@/components/dashboard/run-reminder-scan-button";

type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

type DashboardInvoiceRow = {
  id: string;
  status: InvoiceStatus;
};

type DashboardPaymentRow = {
  amount: number | null;
  paid_at: string;
};

type DashboardExpenseRow = {
  amount: number | null;
  expense_date: string;
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.rpc("mark_overdue_invoices");

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const todayDate = new Date().toISOString().slice(0, 10);

  const [
    leadsResult,
    customersResult,
    invoicesResult,
    paymentsResult,
    expensesResult,
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

    supabase.from("expenses").select("amount, expense_date"),

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

  const invoices = (invoicesResult.data ?? []) as DashboardInvoiceRow[];
  const payments = (paymentsResult.data ?? []) as DashboardPaymentRow[];
  const expenses = (expensesResult.data ?? []) as DashboardExpenseRow[];

  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === "pending" || invoice.status === "partial"
  ).length;

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === "overdue"
  ).length;

  const todayRevenue = payments
    .filter((payment) => {
      const paidAt = new Date(payment.paid_at).getTime();
      return (
        paidAt >= new Date(todayStart).getTime() &&
        paidAt <= new Date(todayEnd).getTime()
      );
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const todayExpenses = expenses
    .filter((expense) => expense.expense_date === todayDate)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const todayProfit = todayRevenue - todayExpenses;

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

      {profile.role === "admin" ? (
        <div className="mt-4">
          <RunReminderScanButton />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatsCard
          title="Total Leads"
          value={String(leadsResult.count || 0)}
          description="All visible leads"
          tone="indigo"
        />
        <StatsCard
          title="Total Customers"
          value={String(customersResult.count || 0)}
          description="All customer accounts"
          tone="emerald"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(todayRevenue)}
          description="Received today"
          tone="amber"
        />
        <StatsCard
          title="Expenses"
          value={formatCurrency(todayExpenses)}
          description="Spent today"
          tone="rose"
        />
        <StatsCard
          title="Profit"
          value={formatCurrency(todayProfit)}
          description="Revenue minus expenses"
          tone="slate"
        />
        <StatsCard
          title="Pending Invoices"
          value={String(pendingInvoices)}
          description="Pending and partial invoices"
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <TasksDueToday tasks={tasksDueTodayResult.data || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activityResult.data || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}