import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InvoiceRow = {
  id: string;
  total_amount: number;
  amount_paid: number;
  due_date: string | null;
  status: string;
};

type RestockPayableRow = {
  id: string;
  total_amount: number;
  paid_amount: number;
  payment_status: "unpaid" | "part_paid" | "paid";
};

export default async function DashboardPage() {
  await requireProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString();

  const [
    { count: customersCount },
    { count: leadsCount },
    { count: openSupportCount },
    { data: invoicesData },
    { count: lowStockCount },
    { count: todayFieldJobsCount },
    { data: monthlyInvoicesData },
    { data: monthlyPaymentsData },
    { data: monthlyExpensesData },
    { data: supplierPayablesData },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("leads")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),

    supabase
      .from("invoices")
      .select("id, total_amount, amount_paid, due_date, status"),

    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .filter("current_quantity", "lte", "minimum_quantity"),

    supabase
      .from("field_jobs")
      .select("*", { count: "exact", head: true })
      .eq("scheduled_date", today),

    supabase
      .from("invoices")
      .select("id, total_amount, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("receipts")
      .select("id, amount, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("expenses")
      .select("id, amount, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("inventory_restock_orders")
      .select("id, total_amount, paid_amount, payment_status")
      .in("payment_status", ["unpaid", "part_paid"]),
  ]);

  const invoices = (invoicesData ?? []) as InvoiceRow[];
  const overdueInvoicesCount = invoices.filter((invoice) => {
    if (!invoice.due_date) return false;
    if (invoice.status === "paid") return false;
    return invoice.due_date < today;
  }).length;

  const monthlyInvoicesTotal = (monthlyInvoicesData ?? []).reduce(
    (sum, item: { total_amount: number }) => sum + Number(item.total_amount || 0),
    0
  );

  const monthlyPaymentsTotal = (monthlyPaymentsData ?? []).reduce(
    (sum, item: { amount: number }) => sum + Number(item.amount || 0),
    0
  );

  const monthlyExpensesTotal = (monthlyExpensesData ?? []).reduce(
    (sum, item: { amount: number }) => sum + Number(item.amount || 0),
    0
  );

  const supplierPayables = (supplierPayablesData ?? []) as RestockPayableRow[];

  const totalSupplierPayables = supplierPayables.reduce((sum, row) => {
    const balance =
      Number(row.total_amount || 0) - Number(row.paid_amount || 0);
    return sum + Math.max(0, balance);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Management Dashboard
        </h2>
        <p className="text-slate-600">
          Overview of sales, operations, finance, inventory, and support.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Customers"
          value={String(customersCount ?? 0)}
          href="/customers"
        />
        <MetricCard
          title="Leads"
          value={String(leadsCount ?? 0)}
          href="/leads"
        />
        <MetricCard
          title="Open Support"
          value={String(openSupportCount ?? 0)}
          href="/support"
        />
        <MetricCard
          title="Today Field Jobs"
          value={String(todayFieldJobsCount ?? 0)}
          href="/field-jobs"
        />
        <MetricCard
          title="Low Stock Items"
          value={String(lowStockCount ?? 0)}
          href="/inventory"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Overdue Invoices"
          value={String(overdueInvoicesCount)}
          href="/payments/invoices"
        />
        <MetricCard
          title="Monthly Invoices"
          value={formatCurrency(monthlyInvoicesTotal)}
          href="/payments/invoices"
        />
        <MetricCard
          title="Monthly Payments"
          value={formatCurrency(monthlyPaymentsTotal)}
          href="/payments/receipts"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatCurrency(monthlyExpensesTotal)}
          href="/expenses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Management Snapshot</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <SnapshotRow
              label="Total Supplier Payables"
              value={formatCurrency(totalSupplierPayables)}
            />
            <SnapshotRow
              label="Outstanding Supplier Orders"
              value={String(supplierPayables.length)}
            />
            <SnapshotRow
              label="Open Support Tickets"
              value={String(openSupportCount ?? 0)}
            />
            <SnapshotRow
              label="Low Stock Alerts"
              value={String(lowStockCount ?? 0)}
            />
            <SnapshotRow
              label="Overdue Invoices"
              value={String(overdueInvoicesCount)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <QuickLink href="/payments/invoices">View Invoices</QuickLink>
            <QuickLink href="/support">View Support</QuickLink>
            <QuickLink href="/inventory">View Inventory</QuickLink>
            <QuickLink href="/suppliers/payables">View Supplier Payables</QuickLink>
            <QuickLink href="/field-jobs/daily-report">Engineer Daily Report</QuickLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-slate-300 hover:shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-500">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}