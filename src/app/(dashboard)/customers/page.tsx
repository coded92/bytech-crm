import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Building2, CircleDollarSign, Plus, Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { requireModule } from "@/lib/auth/require-module";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserPreferences,
  getUserItemsPerPage,
} from "@/lib/preferences/user-preferences";
import { formatCurrency } from "@/lib/utils/format-currency";
import { CustomerTable, type CustomerRow } from "@/components/customers/customer-table";
import { Button } from "@/components/ui/button";

type CustomersPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

type CustomerQueryRow = Omit<
  CustomerRow,
  "project_count" | "invoice_count" | "outstanding_balance"
> & {
  created_at: string;
};

type ProjectRow = {
  id: string;
  customer_id: string | null;
};

type InvoiceRow = {
  id: string;
  customer_id: string;
  balance: number;
};

const allowedStatuses = ["active", "inactive", "suspended"];

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const profile = await requireModule("customers");

  const params = (await searchParams) || {};
  const search = (params.q || "").trim();
  const status = allowedStatuses.includes(params.status || "") ? params.status : "";

  const supabase = await createClient();
  const preferences = await getCurrentUserPreferences(profile.id);
  const itemsPerPage = getUserItemsPerPage(preferences);
  let query = supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      company_name,
      contact_person,
      email,
      phone,
      city,
      state,
      industry,
      business_type,
      plan_type,
      subscription_amount,
      status,
      created_at,
      account_manager:profiles!customers_account_manager_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (search) {
    const like = `%${search}%`;
    query = query.or(
      `company_name.ilike.${like},customer_code.ilike.${like},contact_person.ilike.${like},email.ilike.${like},phone.ilike.${like}`
    );
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data: customerData, error } = await query;
  const baseCustomers = (customerData || []) as CustomerQueryRow[];
  const customerIds = baseCustomers.map((customer) => customer.id);

  const [{ data: projectData }, { data: invoiceData }] =
    customerIds.length > 0
      ? await Promise.all([
          supabase.from("projects").select("id, customer_id").in("customer_id", customerIds),
          supabase.from("payment_invoices").select("id, customer_id, balance").in("customer_id", customerIds),
        ])
      : [{ data: [] }, { data: [] }];

  const projects = (projectData || []) as ProjectRow[];
  const invoices = (invoiceData || []) as InvoiceRow[];
  const projectCountByCustomer = countByCustomer(projects);
  const invoiceCountByCustomer = countByCustomer(invoices);
  const outstandingByCustomer = invoices.reduce<Record<string, number>>((acc, invoice) => {
    acc[invoice.customer_id] = (acc[invoice.customer_id] || 0) + Number(invoice.balance || 0);
    return acc;
  }, {});

  const customers: CustomerRow[] = baseCustomers.map((customer) => ({
    ...customer,
    project_count: projectCountByCustomer[customer.id] || 0,
    invoice_count: invoiceCountByCustomer[customer.id] || 0,
    outstanding_balance: outstandingByCustomer[customer.id] || 0,
  }));

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const activeCustomers = customers.filter((customer) => customer.status === "active").length;
  const newThisMonth = baseCustomers.filter(
    (customer) => new Date(customer.created_at) >= monthStart
  ).length;
  const outstandingTotal = customers.reduce(
    (sum, customer) => sum + customer.outstanding_balance,
    0
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 shadow-xl shadow-indigo-100/60 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Customer Accounts
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Customers
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage active customer workspaces, billing exposure, account ownership, and operational context.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700">
              <Link href="/customers/new">
                <Plus className="size-4" />
                Add Customer
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CustomerMetric
          label="Total Customers"
          value={String(customers.length)}
          caption="Visible customer accounts"
          icon={<Building2 className="size-4" />}
          tone="indigo"
        />
        <CustomerMetric
          label="Active Customers"
          value={String(activeCustomers)}
          caption={`${customers.length - activeCustomers} inactive or suspended`}
          icon={<UsersRound className="size-4" />}
          tone="emerald"
        />
        <CustomerMetric
          label="New This Month"
          value={String(newThisMonth)}
          caption="Created this calendar month"
          icon={<ArrowUpRight className="size-4" />}
          tone="blue"
        />
        <CustomerMetric
          label="Outstanding Balance"
          value={formatCurrency(outstandingTotal)}
          caption="Open balances from invoices"
          icon={outstandingTotal > 0 ? <ArrowDownRight className="size-4" /> : <CircleDollarSign className="size-4" />}
          tone={outstandingTotal > 0 ? "amber" : "emerald"}
        />
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-4 shadow-xl shadow-indigo-100/50">
        <form action="/customers" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search customers, codes, contacts, email, phone..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100"
            />
          </label>

          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <Button type="submit" variant="outline" className="bg-white">
            <SlidersHorizontal className="size-4" />
            Apply
          </Button>

          {(search || status) ? (
            <Button asChild variant="ghost">
              <Link href="/customers">Reset</Link>
            </Button>
          ) : null}
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load customers: {error.message}
        </div>
      ) : (
        <CustomerTable customers={customers.slice(0, itemsPerPage)} />
      )}
    </div>
  );
}

function CustomerMetric({
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
    indigo: {
      gradient: "from-indigo-50 to-white",
      icon: "bg-indigo-100 text-indigo-700",
    },
    emerald: {
      gradient: "from-emerald-50 to-white",
      icon: "bg-emerald-100 text-emerald-700",
    },
    blue: {
      gradient: "from-blue-50 to-white",
      icon: "bg-blue-100 text-blue-700",
    },
    amber: {
      gradient: "from-amber-50 to-white",
      icon: "bg-amber-100 text-amber-700",
    },
  }[tone];

  return (
    <div className={`rounded-3xl border border-white/80 bg-gradient-to-br ${toneClass.gradient} p-4 shadow-sm shadow-indigo-100`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-2xl ${toneClass.icon}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function countByCustomer(rows: Array<{ customer_id: string | null }>) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.customer_id) return acc;
    acc[row.customer_id] = (acc[row.customer_id] || 0) + 1;
    return acc;
  }, {});
}
