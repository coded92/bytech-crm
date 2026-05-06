import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireModule } from "@/lib/auth/require-module";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

type Department =
  | "sales"
  | "operations"
  | "support"
  | "engineering"
  | "inventory"
  | "finance"
  | "hr";

type ProfileWithDepartment = {
  id: string;
  role: "admin" | "staff";
  full_name: string;
  department: Department | null;
  allowed_modules: string[];
};

type InvoiceRow = {
  id: string;
  amount: number;
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

type ProjectRevenueRow = {
  quotation_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  status: string;
};

type Metric = {
  title: string;
  value: string;
  href: string;
  modules?: string[];
  departments?: Department[];
};

type ActivityRow = {
  id: string;
  entity_type: string;
  action: string;
  description: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  await requireModule("dashboard");

  const profile = (await requireProfile()) as ProfileWithDepartment;
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().slice(0, 10);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString();

  const [
    { count: customersCount },
    { count: leadsCount },
    { count: quotationsCount },
    { count: tasksCount },
    { count: activeProjectsCount },
    { count: projectsDueSoonCount },
    { count: overdueProjectTasksCount },
    { count: openSupportCount },
    { count: assetsCount },
    { count: deploymentsCount },
    { count: lowStockCount },
    { count: todayFieldJobsCount },
    { count: suppliersCount },
    { count: reportsCount },
    { count: usersCount },
    { data: invoicesData },
    { data: monthlyInvoicesData },
    { data: monthlyPaymentsData },
    { data: monthlyExpensesData },
    { data: supplierPayablesData },
    { data: projectRevenueData },
    { data: recentActivityData },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),

    supabase.from("leads").select("*", { count: "exact", head: true }),

    supabase.from("quotations").select("*", { count: "exact", head: true }),

    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("completed","cancelled")'),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .in("status", ["paid", "planning", "in_progress", "review", "maintenance"]),

    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("deadline", "is", null)
      .gte("deadline", today)
      .lte("deadline", next7DaysStr)
      .not("status", "in", '("completed","cancelled")'),

    supabase
      .from("project_tasks")
      .select("*", { count: "exact", head: true })
      .not("due_date", "is", null)
      .lt("due_date", new Date().toISOString())
      .not("status", "in", '("completed","cancelled")'),

    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),

    supabase.from("assets").select("*", { count: "exact", head: true }),

    supabase.from("pos_deployments").select("*", { count: "exact", head: true }),

    supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .filter("current_quantity", "lte", "minimum_quantity"),

    supabase
      .from("field_jobs")
      .select("*", { count: "exact", head: true })
      .eq("scheduled_date", today),

    supabase.from("suppliers").select("*", { count: "exact", head: true }),

    supabase.from("daily_reports").select("*", { count: "exact", head: true }),

    supabase.from("profiles").select("*", { count: "exact", head: true }),

    supabase
      .from("payment_invoices")
      .select("id, amount, amount_paid, due_date, status"),

    supabase
      .from("payment_invoices")
      .select("id, amount, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("receipts")
      .select("id, amount_received, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("expenses")
      .select("id, amount, created_at")
      .gte("created_at", monthStartStr),

    supabase
      .from("inventory_restock_orders")
      .select("id, total_amount, paid_amount, payment_status")
      .in("payment_status", ["unpaid", "part_paid"]),

    supabase
      .from("projects")
      .select("quotation_amount, amount_paid, outstanding_balance, status"),

    supabase
      .from("activity_logs")
      .select("id, entity_type, action, description, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const invoices = (invoicesData ?? []) as InvoiceRow[];

  const overdueInvoicesCount = invoices.filter((invoice) => {
    if (!invoice.due_date) return false;
    if (invoice.status === "paid") return false;
    return invoice.due_date < today;
  }).length;

  const monthlyInvoicesTotal = (monthlyInvoicesData ?? []).reduce(
    (sum, item: { amount: number }) => sum + Number(item.amount || 0),
    0
  );

  const monthlyPaymentsTotal = (monthlyPaymentsData ?? []).reduce(
    (sum, item: { amount_received: number }) =>
      sum + Number(item.amount_received || 0),
    0
  );

  const monthlyExpensesTotal = (monthlyExpensesData ?? []).reduce(
    (sum, item: { amount: number }) => sum + Number(item.amount || 0),
    0
  );

  const supplierPayables = (supplierPayablesData ?? []) as RestockPayableRow[];

  const totalSupplierPayables = supplierPayables.reduce((sum, row) => {
    const balance = Number(row.total_amount || 0) - Number(row.paid_amount || 0);
    return sum + Math.max(0, balance);
  }, 0);

  const recentActivities = (recentActivityData ?? []) as ActivityRow[];

  const projectRevenue = (projectRevenueData ?? []) as ProjectRevenueRow[];

  const totalProjectValue = projectRevenue.reduce(
    (sum, project) => sum + Number(project.quotation_amount || 0),
    0
  );

  const totalProjectPaid = projectRevenue.reduce(
    (sum, project) => sum + Number(project.amount_paid || 0),
    0
  );

  const totalProjectOutstanding = projectRevenue.reduce(
    (sum, project) => sum + Number(project.outstanding_balance || 0),
    0
  );

  const metrics: Metric[] = [
    {
      title: "Customers",
      value: String(customersCount ?? 0),
      href: "/customers",
      modules: ["customers"],
      departments: ["sales", "support", "operations", "finance"],
    },
    {
      title: "Leads",
      value: String(leadsCount ?? 0),
      href: "/leads",
      modules: ["leads"],
      departments: ["sales"],
    },
    {
      title: "Quotations",
      value: String(quotationsCount ?? 0),
      href: "/quotations",
      modules: ["quotations"],
      departments: ["sales"],
    },
    {
      title: "Open Tasks",
      value: String(tasksCount ?? 0),
      href: "/tasks",
      modules: ["tasks"],
      departments: ["sales", "support", "operations", "engineering"],
    },
    {
      title: "Active Projects",
      value: String(activeProjectsCount ?? 0),
      href: "/projects",
      modules: ["projects"],
      departments: ["engineering", "operations"],
    },
    {
      title: "Projects Due Soon",
      value: String(projectsDueSoonCount ?? 0),
      href: "/projects",
      modules: ["projects"],
      departments: ["engineering", "operations"],
    },
    {
      title: "Overdue Project Tasks",
      value: String(overdueProjectTasksCount ?? 0),
      href: "/projects",
      modules: ["projects"],
      departments: ["engineering", "operations"],
    },
    {
      title: "Open Support",
      value: String(openSupportCount ?? 0),
      href: "/support",
      modules: ["support"],
      departments: ["support", "engineering"],
    },
    {
      title: "Assets",
      value: String(assetsCount ?? 0),
      href: "/assets",
      modules: ["assets"],
      departments: ["support", "engineering", "operations"],
    },
    {
      title: "Deployments",
      value: String(deploymentsCount ?? 0),
      href: "/deployments",
      modules: ["deployments"],
      departments: ["engineering", "operations"],
    },
    {
      title: "Today Field Jobs",
      value: String(todayFieldJobsCount ?? 0),
      href: "/field-jobs",
      modules: ["field_jobs"],
      departments: ["engineering", "support", "operations"],
    },
    {
      title: "Low Stock Items",
      value: String(lowStockCount ?? 0),
      href: "/inventory",
      modules: ["inventory"],
      departments: ["inventory", "engineering"],
    },
    {
      title: "Suppliers",
      value: String(suppliersCount ?? 0),
      href: "/suppliers",
      modules: ["suppliers"],
      departments: ["inventory", "finance"],
    },
    {
      title: "Overdue Invoices",
      value: String(overdueInvoicesCount),
      href: "/payments/invoices",
      modules: ["invoices", "payments"],
      departments: ["finance", "sales"],
    },
    {
      title: "Monthly Invoices",
      value: formatCurrency(monthlyInvoicesTotal),
      href: "/payments/invoices",
      modules: ["invoices"],
      departments: ["finance", "sales"],
    },
    {
      title: "Monthly Payments",
      value: formatCurrency(monthlyPaymentsTotal),
      href: "/payments/receipts",
      modules: ["payments"],
      departments: ["finance"],
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(monthlyExpensesTotal),
      href: "/expenses",
      modules: ["expenses"],
      departments: ["finance"],
    },
    {
      title: "Project Value",
      value: formatCurrency(totalProjectValue),
      href: "/projects",
      modules: ["projects"],
      departments: ["engineering", "operations", "finance"],
    },
    {
      title: "Project Outstanding",
      value: formatCurrency(totalProjectOutstanding),
      href: "/projects",
      modules: ["projects"],
      departments: ["finance", "operations"],
    },
    {
      title: "Daily Reports",
      value: String(reportsCount ?? 0),
      href: "/reports",
      modules: ["reports"],
      departments: ["sales", "support", "engineering", "operations", "inventory", "finance", "hr"],
    },
    {
      title: "Users",
      value: String(usersCount ?? 0),
      href: "/users",
      modules: ["users"],
      departments: ["hr"],
    },
  ];

  const visibleMetrics =
    profile.role === "admin"
      ? metrics
      : metrics.filter((metric) => {
          const moduleAllowed =
            !metric.modules ||
            metric.modules.some((module) =>
              profile.allowed_modules.includes(module)
            );

          const departmentAllowed =
            !metric.departments ||
            !profile.department ||
            metric.departments.includes(profile.department);

          return moduleAllowed && departmentAllowed;
        });

  const dashboardTitle =
    profile.role === "admin"
      ? "Management Dashboard"
      : `${formatDepartment(profile.department)} Dashboard`;


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {getGreeting()}, {profile.full_name.split(" ")[0]}
        </h2>

        <p className="mt-1 text-sm font-medium text-slate-500">
          {dashboardTitle}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {formatDashboardDate()}
        </p>
        <p className="text-slate-600">
          {profile.role === "admin"
            ? "Company-wide overview of sales, projects, operations, finance, inventory, and support."
            : getDepartmentDescription(profile.department)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniInfoCard label="Role" value={profile.role} />
        <MiniInfoCard
          label="Department"
          value={formatDepartment(profile.department)}
        />
        <MiniInfoCard
          label="Module Access"
          value={
            profile.role === "admin"
              ? "Full Access"
              : `${profile.allowed_modules.length} Modules`
          }
        />
      </div>

      {visibleMetrics.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            No dashboard metrics are available for your current department and module access.
            Please contact an admin to update your permissions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {visibleMetrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              href={metric.href}
            />
          ))}
        </div>
      )}

        <Card>
          <CardHeader>
            <CardTitle>Department Focus</CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-slate-600">
            {getDepartmentFocus(profile.department, profile.role)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Priorities</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 text-sm text-slate-600">
            {getDepartmentPriorities(profile.department, profile.role).map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Health</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {getDepartmentHealth({
              role: profile.role,
              department: profile.department,
              overdueInvoicesCount,
              openSupportCount: openSupportCount ?? 0,
              lowStockCount: lowStockCount ?? 0,
              overdueProjectTasksCount: overdueProjectTasksCount ?? 0,
              projectsDueSoonCount: projectsDueSoonCount ?? 0,
            }).map((item) => (
              <SnapshotRow key={item.label} label={item.label} value={item.value} />
            ))}
          </CardContent>
        </Card>

        <DashboardCharts
          titleOne={getChartTitles(profile.department, profile.role).titleOne}
          titleTwo={getChartTitles(profile.department, profile.role).titleTwo}
          chartOneData={getChartData(profile.department, profile.role, {
            monthlyInvoicesTotal,
            monthlyPaymentsTotal,
            monthlyExpensesTotal,
            totalProjectOutstanding,
            leadsCount: leadsCount ?? 0,
            quotationsCount: quotationsCount ?? 0,
            customersCount: customersCount ?? 0,
            openSupportCount: openSupportCount ?? 0,
            assetsCount: assetsCount ?? 0,
            todayFieldJobsCount: todayFieldJobsCount ?? 0,
            lowStockCount: lowStockCount ?? 0,
            suppliersCount: suppliersCount ?? 0,
            activeProjectsCount: activeProjectsCount ?? 0,
            deploymentsCount: deploymentsCount ?? 0,
          }).chartOne}
          chartTwoData={getChartData(profile.department, profile.role, {
            monthlyInvoicesTotal,
            monthlyPaymentsTotal,
            monthlyExpensesTotal,
            totalProjectOutstanding,
            leadsCount: leadsCount ?? 0,
            quotationsCount: quotationsCount ?? 0,
            customersCount: customersCount ?? 0,
            openSupportCount: openSupportCount ?? 0,
            assetsCount: assetsCount ?? 0,
            todayFieldJobsCount: todayFieldJobsCount ?? 0,
            lowStockCount: lowStockCount ?? 0,
            suppliersCount: suppliersCount ?? 0,
            activeProjectsCount: activeProjectsCount ?? 0,
            deploymentsCount: deploymentsCount ?? 0,
          }).chartTwo}
        />

        <Card>
          <CardHeader>
            <CardTitle>Work Queue</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {getWorkQueue(profile.department, profile.role).map((item) => (
              <QuickLink key={item.href + item.label} href={item.href}>
                {item.label}
              </QuickLink>
            ))}
          </CardContent>
        </Card>

        {canAccess(profile, "reports") ? (
          <Card>
            <CardHeader>
              <CardTitle>Daily Report Reminder</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Submit your daily report before closing for the day so your department
                updates stay visible to management.
              </p>

              <QuickLink href="/reports/new">Submit Today&apos;s Report</QuickLink>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity.</p>
            ) : (
              recentActivities.map((item) => (
                <ActivityItem
                  key={item.id}
                  title={item.description || `${item.entity_type} ${item.action}`}
                  time={formatTimeAgo(item.created_at)}
                />
              ))
            )}
          </CardContent>
        </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {profile.role === "admin"
                ? "Management Snapshot"
                : "Department Snapshot"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {visibleMetrics.length === 0 ? (
              <p className="text-sm text-slate-500">
                No snapshot data available.
              </p>
            ) : (
              visibleMetrics.slice(0, 10).map((metric) => (
                <SnapshotRow
                  key={metric.title}
                  label={metric.title}
                  value={metric.value}
                />
              ))
            )}

            {profile.role === "admin" ? (
              <>
                <SnapshotRow
                  label="Project Amount Paid"
                  value={formatCurrency(totalProjectPaid)}
                />
                <SnapshotRow
                  label="Total Supplier Payables"
                  value={formatCurrency(totalSupplierPayables)}
                />
                <SnapshotRow
                  label="Outstanding Supplier Orders"
                  value={String(supplierPayables.length)}
                />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            {getUniqueQuickLinks(visibleMetrics).length === 0 &&
            !canAccess(profile, "reports") ? (
              <p className="text-slate-500">No quick actions available.</p>
            ) : (
              <>
                {getUniqueQuickLinks(visibleMetrics).map((metric) => (
                  <QuickLink key={metric.href} href={metric.href}>
                    {metric.title}
                  </QuickLink>
                ))}

                {canAccess(profile, "reports") ? (
                  <QuickLink href="/reports/new">Submit Daily Report</QuickLink>
                ) : null}

                {profile.department === "sales" && canAccess(profile, "leads") ? (
                  <QuickLink href="/leads/new">Add New Lead</QuickLink>
                ) : null}

                {profile.department === "support" && canAccess(profile, "support") ? (
                  <QuickLink href="/support/new">Open Support Ticket</QuickLink>
                ) : null}

                {profile.department === "engineering" && canAccess(profile, "field_jobs") ? (
                  <QuickLink href="/field-jobs/new">Create Field Job</QuickLink>
                ) : null}

                {profile.department === "inventory" && canAccess(profile, "restocking") ? (
                  <QuickLink href="/restocking/new">Create Restock Order</QuickLink>
                ) : null}

                {profile.department === "finance" && canAccess(profile, "invoices") ? (
                  <QuickLink href="/payments/invoices/new">Create Invoice</QuickLink>
                ) : null}

                {profile.role === "admin" ? (
                  <>
                    <QuickLink href="/users/new">Create User</QuickLink>
                    <QuickLink href="/projects/new">Create Project</QuickLink>
                    <QuickLink href="/quotations/new">Create Quotation</QuickLink>
                    <QuickLink href="/settings/company">Company Settings</QuickLink>
                  </>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getUniqueQuickLinks(metrics: Metric[]) {
  const seen = new Set<string>();

  return metrics.filter((metric) => {
    if (seen.has(metric.href)) return false;

    seen.add(metric.href);
    return true;
  }).slice(0, 8);
}

function canAccess(profile: ProfileWithDepartment, moduleName: string) {
  return (
    profile.role === "admin" || profile.allowed_modules.includes(moduleName)
  );
}

type ChartMetrics = {
  monthlyInvoicesTotal: number;
  monthlyPaymentsTotal: number;
  monthlyExpensesTotal: number;
  totalProjectOutstanding: number;
  leadsCount: number;
  quotationsCount: number;
  customersCount: number;
  openSupportCount: number;
  assetsCount: number;
  todayFieldJobsCount: number;
  lowStockCount: number;
  suppliersCount: number;
  activeProjectsCount: number;
  deploymentsCount: number;
};

function getChartTitles(department: Department | null, role: "admin" | "staff") {
  if (role === "admin") {
    return {
      titleOne: "Finance Overview",
      titleTwo: "Operations Overview",
    };
  }

  switch (department) {
    case "sales":
      return {
        titleOne: "Sales Pipeline",
        titleTwo: "Customer Activity",
      };
    case "support":
      return {
        titleOne: "Support Overview",
        titleTwo: "Asset / Field Activity",
      };
    case "engineering":
      return {
        titleOne: "Project Delivery",
        titleTwo: "Field Operations",
      };
    case "inventory":
      return {
        titleOne: "Inventory Overview",
        titleTwo: "Supplier Activity",
      };
    case "finance":
      return {
        titleOne: "Finance Overview",
        titleTwo: "Outstanding Balances",
      };
    case "hr":
      return {
        titleOne: "Staff Overview",
        titleTwo: "Reports Overview",
      };
    case "operations":
      return {
        titleOne: "Operations Overview",
        titleTwo: "Delivery Health",
      };
    default:
      return {
        titleOne: "Dashboard Overview",
        titleTwo: "Work Overview",
      };
  }
}

function getChartData(
  department: Department | null,
  role: "admin" | "staff",
  metrics: ChartMetrics
) {
  if (role === "admin") {
    return {
      chartOne: [
        { name: "Invoices", value: metrics.monthlyInvoicesTotal },
        { name: "Payments", value: metrics.monthlyPaymentsTotal },
        { name: "Expenses", value: metrics.monthlyExpensesTotal },
        { name: "Outstanding", value: metrics.totalProjectOutstanding },
      ],
      chartTwo: [
        { name: "Projects", value: metrics.activeProjectsCount },
        { name: "Deployments", value: metrics.deploymentsCount },
        { name: "Support", value: metrics.openSupportCount },
        { name: "Field Jobs", value: metrics.todayFieldJobsCount },
        { name: "Low Stock", value: metrics.lowStockCount },
      ],
    };
  }

  switch (department) {
    case "sales":
      return {
        chartOne: [
          { name: "Leads", value: metrics.leadsCount },
          { name: "Quotations", value: metrics.quotationsCount },
          { name: "Customers", value: metrics.customersCount },
        ],
        chartTwo: [
          { name: "Invoices", value: metrics.monthlyInvoicesTotal },
          { name: "Payments", value: metrics.monthlyPaymentsTotal },
          { name: "Outstanding", value: metrics.totalProjectOutstanding },
        ],
      };

    case "support":
      return {
        chartOne: [
          { name: "Open Tickets", value: metrics.openSupportCount },
          { name: "Customers", value: metrics.customersCount },
          { name: "Assets", value: metrics.assetsCount },
        ],
        chartTwo: [
          { name: "Field Jobs", value: metrics.todayFieldJobsCount },
          { name: "Deployments", value: metrics.deploymentsCount },
          { name: "Projects", value: metrics.activeProjectsCount },
        ],
      };

    case "engineering":
      return {
        chartOne: [
          { name: "Projects", value: metrics.activeProjectsCount },
          { name: "Deployments", value: metrics.deploymentsCount },
          { name: "Field Jobs", value: metrics.todayFieldJobsCount },
        ],
        chartTwo: [
          { name: "Support", value: metrics.openSupportCount },
          { name: "Assets", value: metrics.assetsCount },
          { name: "Low Stock", value: metrics.lowStockCount },
        ],
      };

    case "inventory":
      return {
        chartOne: [
          { name: "Low Stock", value: metrics.lowStockCount },
          { name: "Suppliers", value: metrics.suppliersCount },
          { name: "Field Jobs", value: metrics.todayFieldJobsCount },
        ],
        chartTwo: [
          { name: "Projects", value: metrics.activeProjectsCount },
          { name: "Assets", value: metrics.assetsCount },
          { name: "Support", value: metrics.openSupportCount },
        ],
      };

    case "finance":
      return {
        chartOne: [
          { name: "Invoices", value: metrics.monthlyInvoicesTotal },
          { name: "Payments", value: metrics.monthlyPaymentsTotal },
          { name: "Expenses", value: metrics.monthlyExpensesTotal },
        ],
        chartTwo: [
          { name: "Outstanding", value: metrics.totalProjectOutstanding },
          { name: "Customers", value: metrics.customersCount },
          { name: "Suppliers", value: metrics.suppliersCount },
        ],
      };

    case "operations":
      return {
        chartOne: [
          { name: "Projects", value: metrics.activeProjectsCount },
          { name: "Deployments", value: metrics.deploymentsCount },
          { name: "Field Jobs", value: metrics.todayFieldJobsCount },
        ],
        chartTwo: [
          { name: "Support", value: metrics.openSupportCount },
          { name: "Customers", value: metrics.customersCount },
          { name: "Low Stock", value: metrics.lowStockCount },
        ],
      };

    default:
      return {
        chartOne: [
          { name: "Customers", value: metrics.customersCount },
          { name: "Tasks", value: metrics.activeProjectsCount },
        ],
        chartTwo: [
          { name: "Reports", value: metrics.todayFieldJobsCount },
          { name: "Support", value: metrics.openSupportCount },
        ],
      };
  }
}

function getWorkQueue(
  department: Department | null,
  role: "admin" | "staff"
) {
  if (role === "admin") {
    return [
      { label: "Review Projects", href: "/projects" },
      { label: "Review Invoices", href: "/payments/invoices" },
      { label: "Review Support Tickets", href: "/support" },
      { label: "Review Daily Reports", href: "/reports" },
    ];
  }

  switch (department) {
    case "sales":
      return [
        { label: "Review Leads", href: "/leads" },
        { label: "Review Quotations", href: "/quotations" },
        { label: "Review Customers", href: "/customers" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];

    case "support":
      return [
        { label: "Review Support Tickets", href: "/support" },
        { label: "Review Assets", href: "/assets" },
        { label: "Review Field Jobs", href: "/field-jobs" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];

    case "engineering":
      return [
        { label: "Review Projects", href: "/projects" },
        { label: "Review Field Jobs", href: "/field-jobs" },
        { label: "Review Deployments", href: "/deployments" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];

    case "inventory":
      return [
        { label: "Review Inventory", href: "/inventory" },
        { label: "Review Restocking", href: "/restocking" },
        { label: "Review Suppliers", href: "/suppliers" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];

    case "finance":
      return [
        { label: "Review Invoices", href: "/payments/invoices" },
        { label: "Review Payments", href: "/payments/receipts" },
        { label: "Review Expenses", href: "/expenses" },
        { label: "Review Supplier Payables", href: "/suppliers/payables" },
      ];

    case "hr":
      return [
        { label: "Review Users", href: "/users" },
        { label: "Review Daily Reports", href: "/reports" },
        { label: "Review Audit Logs", href: "/audit-logs" },
      ];

    case "operations":
      return [
        { label: "Review Projects", href: "/projects" },
        { label: "Review Deployments", href: "/deployments" },
        { label: "Review Field Jobs", href: "/field-jobs" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];

    default:
      return [
        { label: "Review Dashboard", href: "/dashboard" },
        { label: "Submit Daily Report", href: "/reports/new" },
      ];
  }
}

function getDepartmentHealth({
  role,
  department,
  overdueInvoicesCount,
  openSupportCount,
  lowStockCount,
  overdueProjectTasksCount,
  projectsDueSoonCount,
}: {
  role: "admin" | "staff";
  department: Department | null;
  overdueInvoicesCount: number;
  openSupportCount: number;
  lowStockCount: number;
  overdueProjectTasksCount: number;
  projectsDueSoonCount: number;
}) {
  if (role === "admin") {
    return [
      { label: "Overdue Invoices", value: String(overdueInvoicesCount) },
      { label: "Open Support Tickets", value: String(openSupportCount) },
      { label: "Low Stock Alerts", value: String(lowStockCount) },
      { label: "Overdue Project Tasks", value: String(overdueProjectTasksCount) },
      { label: "Projects Due Soon", value: String(projectsDueSoonCount) },
    ];
  }

  switch (department) {
    case "sales":
      return [
        { label: "Overdue Invoices", value: String(overdueInvoicesCount) },
        { label: "Projects Due Soon", value: String(projectsDueSoonCount) },
      ];

    case "support":
      return [
        { label: "Open Support Tickets", value: String(openSupportCount) },
        { label: "Today Field Issues", value: String(openSupportCount) },
      ];

    case "engineering":
      return [
        { label: "Overdue Project Tasks", value: String(overdueProjectTasksCount) },
        { label: "Projects Due Soon", value: String(projectsDueSoonCount) },
      ];

    case "inventory":
      return [
        { label: "Low Stock Alerts", value: String(lowStockCount) },
      ];

    case "finance":
      return [
        { label: "Overdue Invoices", value: String(overdueInvoicesCount) },
      ];

    case "operations":
      return [
        { label: "Projects Due Soon", value: String(projectsDueSoonCount) },
        { label: "Open Support Tickets", value: String(openSupportCount) },
      ];

    case "hr":
      return [
        { label: "Pending Department Reports", value: "Review required" },
      ];

    default:
      return [
        { label: "Status", value: "No department assigned" },
      ];
  }
}

function getDepartmentPriorities(
  department: Department | null,
  role: "admin" | "staff"
) {
  if (role === "admin") {
    return [
      "Review company-wide performance",
      "Check overdue invoices and supplier payables",
      "Monitor active projects and support tickets",
      "Review staff reports and operational blockers",
    ];
  }

  switch (department) {
    case "sales":
      return [
        "Follow up on pending leads",
        "Convert warm leads into customers",
        "Send quotations awaiting approval",
        "Submit daily sales report",
      ];

    case "support":
      return [
        "Resolve open support tickets",
        "Follow up with affected customers",
        "Escalate critical unresolved issues",
        "Submit daily support report",
      ];

    case "engineering":
      return [
        "Complete assigned field jobs",
        "Review overdue project tasks",
        "Track deployment progress",
        "Submit technical daily report",
      ];

    case "inventory":
      return [
        "Review low stock alerts",
        "Raise restocking requests",
        "Check supplier delivery timelines",
        "Update stock movement records",
      ];

    case "finance":
      return [
        "Review unpaid invoices",
        "Confirm received payments",
        "Track supplier payables",
        "Review monthly expense trends",
      ];

    case "hr":
      return [
        "Review user access permissions",
        "Monitor staff activity reports",
        "Check onboarding requirements",
        "Review audit activity",
      ];

    case "operations":
      return [
        "Review operational projects",
        "Coordinate field execution",
        "Check deployment schedules",
        "Resolve workflow blockers",
      ];

    default:
      return [
        "Review assigned tasks",
        "Check pending updates",
        "Follow department workflow",
      ];
  }
}


function getDepartmentFocus(
  department: Department | null,
  role: "admin" | "staff"
) {
  if (role === "admin") {
    return "Monitor company-wide activity, overdue items, payments, projects, and staff performance.";
  }

  switch (department) {
    case "sales":
      return "Focus on lead follow-ups, quotations, customer conversion, and daily sales reports.";
    case "support":
      return "Focus on open support tickets, customer issues, asset status, and field support work.";
    case "engineering":
      return "Focus on project delivery, deployments, field jobs, overdue project tasks, and technical updates.";
    case "inventory":
      return "Focus on low stock items, restocking, suppliers, and stock availability for operations.";
    case "finance":
      return "Focus on invoices, payments, expenses, supplier payables, and outstanding balances.";
    case "hr":
      return "Focus on users, department access, staff reports, and audit activity.";
    case "operations":
      return "Focus on projects, deployments, customer operations, and team coordination.";
    default:
      return "Focus on your assigned modules and daily responsibilities.";
  }
}

function getDepartmentDescription(department: Department | null) {
  switch (department) {
    case "sales":
      return "Track leads, customers, quotations, tasks, and sales activity.";
    case "support":
      return "Track support tickets, customer support work, assets, and field jobs.";
    case "engineering":
      return "Track projects, deployments, field jobs, assets, and project tasks.";
    case "inventory":
      return "Track inventory, low stock alerts, suppliers, and restocking activity.";
    case "finance":
      return "Track invoices, payments, expenses, supplier payables, and outstanding balances.";
    case "hr":
      return "Track users, staff access, daily reports, and audit activity.";
    case "operations":
      return "Track projects, customers, deployments, tasks, and field operations.";
    default:
      return "Your department overview based on assigned access.";
  }
}

function formatDashboardDate() {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDepartment(department: Department | null) {
  if (!department) return "Department";

  return department
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}

function ActivityItem({
  title,
  time,
}: {
  title: string;
  time: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <p className="text-sm font-medium text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {time}
      </p>
    </div>
  );
}

function MiniInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 capitalize text-sm font-semibold text-slate-900">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
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