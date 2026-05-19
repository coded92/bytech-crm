import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, ArrowLeft, CreditCard, FileText, FolderKanban, Mail, Phone, ReceiptText } from "lucide-react";
import type { Customer } from "@/types";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatUserDate, formatUserDateTime } from "@/lib/preferences/format";
import {
  getCurrentUserPreferences,
  type UserPreferenceSnapshot,
} from "@/lib/preferences/user-preferences";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerStatusForm } from "@/components/customers/customer-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CustomerDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: "pending" | "partial" | "paid" | "overdue" | "waived";
  due_date: string;
  created_at: string;
};

type ProjectRow = {
  id: string;
  project_code: string;
  project_name: string;
  status: string;
  priority: string;
  progress: number;
  quotation_amount: number;
  outstanding_balance: number;
  start_date: string | null;
  deadline: string | null;
  project_manager?: {
    full_name: string | null;
  } | null;
};

type BranchRow = {
  id: string;
  branch_name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
};

type ActivityRow = {
  id: string;
  action: string;
  description: string | null;
  created_at: string;
  actor?: {
    full_name: string | null;
  } | null;
};

type RelatedLead = {
  id: string;
  company_name: string;
} | null;

const tabs = ["overview", "projects", "invoices", "branches", "activity"] as const;
type CustomerTab = (typeof tabs)[number];

export default async function CustomerDetailsPage({
  params,
  searchParams,
}: CustomerDetailsPageProps) {
  const profile = await requireModule("customers");
  const preferences = await getCurrentUserPreferences(profile.id);

  const { id } = await params;
  const { tab } = (await searchParams) || {};
  const activeTab: CustomerTab = tabs.includes(tab as CustomerTab)
    ? (tab as CustomerTab)
    : "overview";

  const supabase = await createClient();

  const [
    { data: customerData },
    { data: invoiceData },
    { data: projectData },
    { data: branchData },
    { data: activityData },
    { data: relatedLead },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select(`
        *,
        account_manager:profiles!customers_account_manager_id_fkey(full_name),
        created_by_profile:profiles!customers_created_by_fkey(full_name)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("payment_invoices")
      .select("id, invoice_number, amount, amount_paid, balance, status, due_date, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select(`
        id,
        project_code,
        project_name,
        status,
        priority,
        progress,
        quotation_amount,
        outstanding_balance,
        start_date,
        deadline,
        project_manager:profiles!projects_project_manager_id_fkey(full_name)
      `)
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_branches")
      .select("id, branch_name, contact_person, phone, address, city, state, is_active, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("id, action, description, created_at, actor:profiles!activity_logs_actor_id_fkey(full_name)")
      .eq("entity_type", "customer")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("leads")
      .select("id, company_name")
      .eq("converted_customer_id", id)
      .maybeSingle(),
  ]);

  const customer = customerData as Customer | null;
  const invoices = (invoiceData ?? []) as InvoiceRow[];
  const projects = (projectData ?? []) as ProjectRow[];
  const branches = (branchData ?? []) as BranchRow[];
  const activities = (activityData ?? []) as ActivityRow[];
  const sourceLead = relatedLead as RelatedLead;

  if (!customer) {
    notFound();
  }

  const totalBilled = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
  const outstandingBalance = invoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
  const activeBranches = branches.filter((branch) => branch.is_active).length;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-indigo-700">
        <Link href="/customers">
          <ArrowLeft className="size-4" />
          Back to customers
        </Link>
      </Button>

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-white to-indigo-50/70 shadow-xl shadow-indigo-100/60">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-blue-100 text-xl font-bold uppercase text-indigo-700 shadow-inner sm:size-20">
                {initials(customer.company_name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    {customer.company_name}
                  </h1>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {customer.industry || customer.business_type || "Customer account"}
                  {customer.onboarding_date
                    ? ` · Customer since ${formatUserDate(
                        customer.onboarding_date,
                        preferences
                      )}`
                    : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <QuickAction href={customer.email ? `mailto:${customer.email}` : undefined} icon={<Mail className="size-4" />} label="Email" />
                  <QuickAction href={customer.phone ? `tel:${customer.phone}` : undefined} icon={<Phone className="size-4" />} label="Call" />
                  <QuickAction href={`/customers/${customer.id}/statement`} icon={<ReceiptText className="size-4" />} label="Statement" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="bg-white/80">
                <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
              </Button>
              {sourceLead ? (
                <Button asChild variant="outline" className="bg-white/80">
                  <Link href={`/leads/${sourceLead.id}`}>Source Lead</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white/70 px-3 sm:px-5">
          <nav className="flex gap-1 overflow-x-auto">
            <WorkspaceTab id="overview" label="Overview" activeTab={activeTab} />
            <WorkspaceTab id="projects" label="Projects" count={projects.length} activeTab={activeTab} />
            <WorkspaceTab id="invoices" label="Invoices" count={invoices.length} activeTab={activeTab} />
            <WorkspaceTab id="branches" label="Branches" count={branches.length} activeTab={activeTab} />
            <WorkspaceTab id="activity" label="Activity" count={activities.length} activeTab={activeTab} />
          </nav>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetric label="Projects" value={String(projects.length)} caption={`${projects.filter((project) => project.status === "completed").length} completed`} icon={<FolderKanban className="size-4" />} tone="indigo" />
        <WorkspaceMetric label="Invoices" value={String(invoices.length)} caption={`${invoices.filter((invoice) => invoice.status === "paid").length} paid`} icon={<FileText className="size-4" />} tone="blue" />
        <WorkspaceMetric label="Total Billed" value={formatCurrency(totalBilled)} caption={`${formatCurrency(totalPaid)} received`} icon={<CreditCard className="size-4" />} tone="emerald" />
        <WorkspaceMetric label="Outstanding" value={formatCurrency(outstandingBalance)} caption="Open invoice balance" icon={<ReceiptText className="size-4" />} tone={outstandingBalance > 0 ? "amber" : "emerald"} />
      </section>

      {activeTab === "overview" ? (
        <OverviewTab
          customer={customer}
          invoices={invoices}
          projects={projects}
          branches={branches}
          activities={activities}
          activeBranches={activeBranches}
          outstandingBalance={outstandingBalance}
          preferences={preferences}
        />
      ) : null}

      {activeTab === "projects" ? <ProjectsTab projects={projects} /> : null}
      {activeTab === "invoices" ? (
        <InvoicesTab invoices={invoices} dateFormat={preferences.date_format} />
      ) : null}
      {activeTab === "branches" ? <BranchesTab branches={branches} /> : null}
      {activeTab === "activity" ? (
        <ActivityTab activities={activities} preferences={preferences} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  customer,
  invoices,
  projects,
  branches,
  activities,
  activeBranches,
  outstandingBalance,
  preferences,
}: {
  customer: Customer;
  invoices: InvoiceRow[];
  projects: ProjectRow[];
  branches: BranchRow[];
  activities: ActivityRow[];
  activeBranches: number;
  outstandingBalance: number;
  preferences: Pick<UserPreferenceSnapshot, "date_format" | "time_format">;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-6">
        <PremiumCard title={`About ${customer.company_name}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Primary Contact" value={customer.contact_person} />
            <InfoItem label="Email" value={customer.email} />
            <InfoItem label="Phone" value={customer.phone} />
            <InfoItem label="Alternate Phone" value={customer.alternate_phone} />
            <InfoItem label="Industry" value={customer.industry} />
            <InfoItem label="Business Type" value={customer.business_type} />
            <InfoItem label="Plan Type" value={customer.plan_type} />
            <InfoItem label="Billing Cycle" value={customer.billing_cycle} />
            <InfoItem label="Subscription" value={formatCurrency(customer.subscription_amount)} />
            <InfoItem label="Setup Fee" value={formatCurrency(customer.setup_fee)} />
            <InfoItem label="Onboarding" value={formatUserDate(customer.onboarding_date, preferences)} />
            <InfoItem label="Go Live" value={formatUserDate(customer.go_live_date, preferences)} />
            <InfoItem label="Account Manager" value={customer.account_manager?.full_name ?? "-"} />
            <InfoItem label="Created By" value={customer.created_by_profile?.full_name ?? "-"} />
            <InfoItem label="Location" value={[customer.city, customer.state].filter(Boolean).join(", ") || "-"} />
            <InfoItem label="Address" value={customer.address} />
          </div>
          {customer.notes ? (
            <div className="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-slate-700">
              {customer.notes}
            </div>
          ) : null}
        </PremiumCard>

        <PremiumCard title="Recent Projects" action={<Link href="?tab=projects" className="text-xs font-semibold text-indigo-700">View all</Link>}>
          <div className="space-y-3">
            {projects.slice(0, 4).map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}
            {projects.length === 0 ? <EmptyState message="No projects are linked to this customer yet." /> : null}
          </div>
        </PremiumCard>
      </div>

      <div className="space-y-6">
        <PremiumCard title="Financial Summary">
          <div className="space-y-3">
            <SummaryLine label="Invoices" value={String(invoices.length)} />
            <SummaryLine label="Outstanding" value={formatCurrency(outstandingBalance)} danger={outstandingBalance > 0} />
            <SummaryLine label="Active Branches" value={`${activeBranches} of ${branches.length}`} />
            <Button asChild variant="outline" className="mt-2 w-full bg-white">
              <Link href="?tab=invoices">View invoices</Link>
            </Button>
          </div>
        </PremiumCard>

        <CustomerStatusForm
          customerId={customer.id}
          currentStatus={customer.status}
          currentNotes={customer.notes}
        />

        <PremiumCard title="Recent Activity" action={<Link href="?tab=activity" className="text-xs font-semibold text-indigo-700">View all</Link>}>
          <div className="space-y-3">
            {activities.slice(0, 5).map((item) => (
              <ActivityListItem key={item.id} item={item} preferences={preferences} />
            ))}
            {activities.length === 0 ? <EmptyState message="No customer activity has been logged yet." /> : null}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}

function ProjectsTab({ projects }: { projects: ProjectRow[] }) {
  return (
    <PremiumCard title="Projects">
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
        {projects.length === 0 ? <EmptyState message="No projects are linked to this customer yet." /> : null}
      </div>
    </PremiumCard>
  );
}

function InvoicesTab({
  invoices,
  dateFormat,
}: {
  invoices: InvoiceRow[];
  dateFormat: UserPreferenceSnapshot["date_format"];
}) {
  return (
    <PremiumCard title="Invoices">
      <div className="overflow-hidden rounded-3xl border border-slate-100">
        <div className="divide-y divide-slate-100">
          {invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/payments/invoices/${invoice.id}`}
              className="grid gap-3 bg-white p-4 transition hover:bg-indigo-50/40 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_0.8fr]"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{invoice.invoice_number}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Due {formatUserDate(invoice.due_date, { date_format: dateFormat })}
                </p>
              </div>
              <InvoiceStatus status={invoice.status} />
              <Amount label="Amount" value={invoice.amount} />
              <Amount label="Paid" value={invoice.amount_paid} />
              <Amount label="Balance" value={invoice.balance} danger={invoice.balance > 0} />
            </Link>
          ))}
          {invoices.length === 0 ? <EmptyState message="No invoices are linked to this customer yet." /> : null}
        </div>
      </div>
    </PremiumCard>
  );
}

function BranchesTab({ branches }: { branches: BranchRow[] }) {
  return (
    <PremiumCard title="Branches & Locations">
      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{branch.branch_name}</p>
                <p className="mt-1 text-sm text-slate-500">{branch.contact_person || "No branch contact"}</p>
              </div>
              <Badge variant="outline" className={branch.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                {branch.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{branch.phone || "-"}</p>
              <p>{[branch.address, branch.city, branch.state].filter(Boolean).join(", ") || "-"}</p>
            </div>
          </div>
        ))}
        {branches.length === 0 ? <EmptyState message="No branch/location records are linked to this customer yet." /> : null}
      </div>
    </PremiumCard>
  );
}

function ActivityTab({
  activities,
  preferences,
}: {
  activities: ActivityRow[];
  preferences: Pick<UserPreferenceSnapshot, "date_format" | "time_format">;
}) {
  return (
    <PremiumCard title="Activity">
      <div className="space-y-3">
        {activities.map((item) => (
          <ActivityListItem key={item.id} item={item} preferences={preferences} />
        ))}
        {activities.length === 0 ? <EmptyState message="No customer activity has been logged yet." /> : null}
      </div>
    </PremiumCard>
  );
}

function WorkspaceTab({
  id,
  label,
  count,
  activeTab,
}: {
  id: CustomerTab;
  label: string;
  count?: number;
  activeTab: CustomerTab;
}) {
  const active = activeTab === id;

  return (
    <Link
      href={`?tab=${id}`}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition ${
        active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-slate-500 hover:text-slate-900"
      }`}
    >
      {label}
      {typeof count === "number" ? (
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-700">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function WorkspaceMetric({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  tone: "indigo" | "emerald" | "blue" | "amber";
}) {
  const toneClass = {
    indigo: "bg-indigo-100 text-indigo-700 from-indigo-50",
    emerald: "bg-emerald-100 text-emerald-700 from-emerald-50",
    blue: "bg-blue-100 text-blue-700 from-blue-50",
    amber: "bg-amber-100 text-amber-700 from-amber-50",
  }[tone];
  const [iconBg, iconText, gradientFrom] = toneClass.split(" ");

  return (
    <div className={`rounded-3xl border border-white/80 bg-gradient-to-br ${gradientFrom} to-white p-4 shadow-sm shadow-indigo-100`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-2xl ${iconBg} ${iconText}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function PremiumCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/80 bg-white/95 shadow-xl shadow-indigo-100/50">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <CardTitle className="text-base font-semibold text-slate-950">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function ProjectListItem({ project }: { project: ProjectRow }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{project.project_name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {project.project_code} · {project.project_manager?.full_name || "Unassigned"}
          </p>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {project.status.replaceAll("_", " ")}
        </Badge>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(Math.max(project.progress || 0, 0), 100)}%` }} />
        </div>
        <span className="text-xs font-semibold text-slate-600">{project.progress || 0}%</span>
      </div>
    </Link>
  );
}

function ActivityListItem({
  item,
  preferences,
}: {
  item: ActivityRow;
  preferences: Pick<UserPreferenceSnapshot, "date_format" | "time_format">;
}) {
  return (
    <div className="flex gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Activity className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold capitalize text-slate-950">
          {item.action.replaceAll("_", " ")}
        </p>
        <p className="mt-1 text-sm text-slate-600">{item.description || "No description"}</p>
        <p className="mt-2 text-xs text-slate-500">
          {item.actor?.full_name || "System"} ·{" "}
          {formatUserDateTime(item.created_at, preferences)}
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
}) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled className="bg-white/70">
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className="bg-white/80">
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}

function SummaryLine({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/70 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-semibold ${danger ? "text-red-600" : "text-slate-950"}`}>
        {value}
      </span>
    </div>
  );
}

function InvoiceStatus({ status }: { status: InvoiceRow["status"] }) {
  const className =
    status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "overdue"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "partial"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">Status</p>
      <Badge variant="outline" className={`capitalize ${className}`}>
        {status.replaceAll("_", " ")}
      </Badge>
    </div>
  );
}

function Amount({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${danger ? "text-red-600" : "text-slate-950"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
