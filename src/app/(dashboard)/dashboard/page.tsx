import { subDays, format } from "date-fns";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TasksDueToday } from "@/components/dashboard/tasks-due-today";
import { RunReminderScanButton } from "@/components/dashboard/run-reminder-scan-button";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { SummaryGrid } from "@/components/dashboard/summary-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

type InvoiceRow = {
  id: string;
  status: InvoiceStatus;
};

type LeadStatus = "new" | "contacted" | "interested" | "follow_up" | "closed";

type LeadPipelineRow = {
  status: LeadStatus;
};

type PaymentRow = {
  amount: number | null;
  paid_at: string;
};

type ExpenseRow = {
  amount: number | null;
  expense_date: string;
};

function buildLast7DaysLabels() {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    return {
      key: format(date, "yyyy-MM-dd"),
      label: format(date, "dd MMM"),
    };
  });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.rpc("mark_overdue_invoices");

  const last7Days = buildLast7DaysLabels();
  const startDate = last7Days[0]?.key;

  const [
    leadsResult,
    customersResult,
    invoicesResult,
    paymentsResult,
    expensesResult,
    tasksDueTodayResult,
    activityResult,
    leadPipelineResult,
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

    supabase
      .from("payment_transactions")
      .select("amount, paid_at")
      .gte("paid_at", `${startDate}T00:00:00.000Z`),

    supabase
      .from("expenses")
      .select("amount, expense_date")
      .gte("expense_date", startDate),

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
          .gte("due_date", `${format(new Date(), "yyyy-MM-dd")}T00:00:00.000Z`)
          .lte("due_date", `${format(new Date(), "yyyy-MM-dd")}T23:59:59.999Z`)
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
          .gte("due_date", `${format(new Date(), "yyyy-MM-dd")}T00:00:00.000Z`)
          .lte("due_date", `${format(new Date(), "yyyy-MM-dd")}T23:59:59.999Z`)
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

    supabase.from("leads").select("status"),
  ]);

  const invoices = (invoicesResult.data ?? []) as InvoiceRow[];
  const leadPipeline = (leadPipelineResult.data ?? []) as LeadPipelineRow[];
  const payments = (paymentsResult.data ?? []) as PaymentRow[];
  const expenses = (expensesResult.data ?? []) as ExpenseRow[];

  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === "pending" || invoice.status === "partial"
  ).length;

  const overdueInvoices = invoices.filter(
    (invoice) => invoice.status === "overdue"
  ).length;

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "paid"
  ).length;

  const invoiceSummary = [
    {
      label: "Pending",
      value: invoices.filter((i) => i.status === "pending").length,
    },
    {
      label: "Partial",
      value: invoices.filter((i) => i.status === "partial").length,
    },
    {
      label: "Paid",
      value: paidInvoices,
    },
    {
      label: "Overdue",
      value: overdueInvoices,
    },
  ];

  const leadSummary = [
    {
      label: "New",
      value: leadPipeline.filter((l) => l.status === "new").length,
    },
    {
      label: "Contacted",
      value: leadPipeline.filter((l) => l.status === "contacted").length,
    },
    {
      label: "Interested",
      value: leadPipeline.filter((l) => l.status === "interested").length,
    },
    {
      label: "Follow-up",
      value: leadPipeline.filter((l) => l.status === "follow_up").length,
    },
    {
      label: "Closed",
      value: leadPipeline.filter((l) => l.status === "closed").length,
    },
  ];

  const revenueChart = last7Days.map((day) => {
    const total = payments
      .filter((payment) => payment.paid_at.slice(0, 10) === day.key)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return { label: day.label, value: total };
  });

  const expenseChart = last7Days.map((day) => {
    const total = expenses
      .filter((expense) => expense.expense_date === day.key)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return { label: day.label, value: total };
  });

  const profitChart = last7Days.map((day) => {
    const revenue = payments
      .filter((payment) => payment.paid_at.slice(0, 10) === day.key)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const dailyExpenses = expenses
      .filter((expense) => expense.expense_date === day.key)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return { label: day.label, value: revenue - dailyExpenses };
  });

  const todayLabel = format(new Date(), "dd MMM");

  const todayRevenue =
    revenueChart.find((item) => item.label === todayLabel)?.value || 0;

  const todayExpenses =
    expenseChart.find((item) => item.label === todayLabel)?.value || 0;

  const todayProfit = todayRevenue - todayExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h2>
        <p className="text-slate-600">Welcome back, {profile.full_name}.</p>

        {profile.role === "admin" ? (
          <div className="mt-4">
            <RunReminderScanButton />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
          tone="emerald"
        />
        <StatsCard
          title="Pending Invoices"
          value={String(pendingInvoices)}
          description="Pending and partial"
          tone="slate"
        />
        <StatsCard
          title="Overdue Invoices"
          value={String(overdueInvoices)}
          description="Need attention"
          tone="rose"
        />
        <StatsCard
          title="Total Leads"
          value={String(leadsResult.count || 0)}
          description="All visible leads"
          tone="indigo"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AnalyticsChart title="Revenue Trend (7 days)" data={revenueChart} />
        <AnalyticsChart title="Expense Trend (7 days)" data={expenseChart} />
        <AnalyticsChart title="Profit Trend (7 days)" data={profitChart} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SummaryGrid title="Lead Pipeline Summary" items={leadSummary} />
        <SummaryGrid title="Invoice Status Summary" items={invoiceSummary} />
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