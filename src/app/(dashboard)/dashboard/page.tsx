import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireModule } from "@/lib/auth/require-module";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

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
  entity_id: string | null;
  action: string;
  description: string | null;
  created_at: string;
  actor?: {
    full_name: string | null;
  } | null;
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
      .select(`
        id,
        entity_type,
        entity_id,
        action,
        description,
        created_at,
        actor:profiles!activity_logs_actor_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(12),
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

  const recentActivities = ((recentActivityData ?? []) as ActivityRow[]).filter(
    (activity) => canSeeActivity(profile, activity.entity_type)
  ).slice(0, 8);

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
  const moduleAccessLabel =
    profile.role === "admin"
      ? "Full Access"
      : `${profile.allowed_modules.length} Modules`;
  const primaryMetrics = visibleMetrics.slice(0, 6);
  const secondaryMetrics = visibleMetrics.slice(6);
  const chartTitles = getChartTitles(profile.department, profile.role);
  const chartData = getChartData(profile.department, profile.role, {
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
  });
  const healthItems = getDepartmentHealth({
    role: profile.role,
    department: profile.department,
    overdueInvoicesCount,
    openSupportCount: openSupportCount ?? 0,
    lowStockCount: lowStockCount ?? 0,
    overdueProjectTasksCount: overdueProjectTasksCount ?? 0,
    projectsDueSoonCount: projectsDueSoonCount ?? 0,
  });
  const quickLinks = getUniqueQuickLinks(visibleMetrics);


  return (
    <div className="space-y-7 pb-6">
      <DashboardHero
        greeting={`${getGreeting()}, ${profile.full_name.split(" ")[0]}`}
        title={dashboardTitle}
        date={formatDashboardDate()}
        description={
          profile.role === "admin"
            ? "Company-wide overview of sales, projects, operations, finance, inventory, and support."
            : getDepartmentDescription(profile.department)
        }
        role={profile.role}
        department={formatDepartment(profile.department)}
        moduleAccess={moduleAccessLabel}
        focus={getDepartmentFocus(profile.department, profile.role)}
      />

      {visibleMetrics.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-600">
            No dashboard metrics are available for your current department and
            module access. Please contact an admin to update your permissions.
          </p>
        </SectionCard>
      ) : (
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Executive Summary"
            title="Key metrics"
            description="Your most relevant indicators, filtered by role, department, and module access."
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {primaryMetrics.map((metric, index) => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                href={metric.href}
                priority={index === 0 ? "primary" : "default"}
              />
            ))}
          </div>

          {secondaryMetrics.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {secondaryMetrics.map((metric) => (
                <CompactMetricLink key={metric.title} metric={metric} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="Today's Priorities"
          eyebrow="Focus"
          description="A shorter working list for the department."
        >
          <PriorityList
            items={getDepartmentPriorities(profile.department, profile.role)}
          />
        </SectionCard>

        <SectionCard
          title="Department Health"
          eyebrow="Signals"
          description="Operational indicators that may need attention."
        >
          <HealthPanel items={healthItems} />
        </SectionCard>
      </div>

      <DashboardCharts
        titleOne={chartTitles.titleOne}
        titleTwo={chartTitles.titleTwo}
        chartOneData={chartData.chartOne}
        chartTwoData={chartData.chartTwo}
      />

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title="Work Queue" eyebrow="Next Actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {getWorkQueue(profile.department, profile.role).map((item) => (
              <QuickLink key={item.href + item.label} href={item.href}>
                {item.label}
              </QuickLink>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={
            profile.role === "admin"
              ? "Management Snapshot"
              : "Department Snapshot"
          }
          eyebrow="Overview"
        >
          <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {visibleMetrics.length === 0 ? (
              <p className="text-sm text-slate-500">No snapshot data available.</p>
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
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Recent Activity" eyebrow="Live Feed">
          <ActivityFeed activities={recentActivities} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Quick Access" eyebrow="Shortcuts">
            <div className="space-y-2 text-sm">
              {quickLinks.length === 0 && !canAccess(profile, "reports") ? (
                <p className="text-slate-500">No quick actions available.</p>
              ) : (
                <>
                  {quickLinks.map((metric) => (
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
            </div>
          </SectionCard>

          {canAccess(profile, "reports") ? (
            <SectionCard title="Daily Report Reminder" eyebrow="Closeout">
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  Submit your daily report before closing for the day so your
                  department updates stay visible to management.
                </p>

                <QuickLink href="/reports/new">Submit Today&apos;s Report</QuickLink>
              </div>
            </SectionCard>
          ) : null}
        </div>
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

function canSeeActivity(profile: ProfileWithDepartment, entityType: string) {
  if (profile.role === "admin") return true;

  const entityModuleMap: Record<string, string[]> = {
    customer: ["customers"],
    lead: ["leads"],
    task: ["tasks"],
    quotation: ["quotations"],
    invoice: ["payments", "invoices"],
    payment: ["payments"],
    support_ticket: ["support"],
    field_job: ["field_jobs"],
    project: ["projects"],
    project_task: ["projects"],
    project_member: ["projects"],
    inventory: ["inventory"],
    inventory_item: ["inventory"],
    supplier: ["suppliers"],
    asset: ["assets"],
    user: ["users"],
    expense: ["expenses"],
    daily_report: ["reports"],
    deployment: ["deployments"],
    restock_order: ["restocking"],
  };

  const modules = entityModuleMap[entityType];

  if (!modules) return false;

  return modules.some((moduleName) => profile.allowed_modules.includes(moduleName));
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



function DashboardHero({
  greeting,
  title,
  date,
  description,
  role,
  department,
  moduleAccess,
  focus,
}: {
  greeting: string;
  title: string;
  date: string;
  description: string;
  role: string;
  department: string;
  moduleAccess: string;
  focus: string;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            {date}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-300">{title}</p>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-200">
            {description}
          </p>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroContext label="Role" value={role} />
            <HeroContext label="Department" value={department} />
            <HeroContext label="Module Access" value={moduleAccess} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Department Focus
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{focus}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroContext({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-full rounded-2xl border border-slate-200 bg-white py-0 shadow-sm">
      {(title || eyebrow || description) ? (
        <div className="border-b border-slate-100 px-5 py-4">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h3 className="mt-1 text-base font-semibold text-slate-950">{title}</h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  href,
  priority = "default",
}: {
  title: string;
  value: string;
  href: string;
  priority?: "primary" | "default";
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card
        className={
          priority === "primary"
            ? "h-full rounded-2xl border-slate-900 bg-slate-950 py-0 text-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md"
            : "h-full rounded-2xl border-slate-200 bg-white py-0 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:shadow-md"
        }
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <p
              className={
                priority === "primary"
                  ? "text-xs font-semibold uppercase tracking-wide text-slate-300"
                  : "text-xs font-semibold uppercase tracking-wide text-slate-500"
              }
            >
              {title}
            </p>
            <span
              className={
                priority === "primary"
                  ? "h-2 w-2 rounded-full bg-white/70"
                  : "h-2 w-2 rounded-full bg-slate-300"
              }
            />
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function CompactMetricLink({ metric }: { metric: Metric }) {
  return (
    <Link
      href={metric.href}
      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="min-w-0 truncate font-medium text-slate-600">
        {metric.title}
      </span>
      <span className="shrink-0 font-semibold text-slate-950">{metric.value}</span>
    </Link>
  );
}

function PriorityList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item}
          className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {index + 1}
          </span>
          <span className="leading-6">{item}</span>
        </div>
      ))}
    </div>
  );
}

function HealthPanel({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-sm"
        >
          <span className="text-slate-500">{item.label}</span>
          <span className="text-right font-semibold text-slate-950">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
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
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span>{children}</span>
      <span className="text-slate-400">→</span>
    </Link>
  );
}
