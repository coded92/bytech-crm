import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Building2, Mail, MoreHorizontal, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CustomerRow = {
  id: string;
  customer_code: string | null;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  business_type: string | null;
  plan_type: "cloud" | "offline" | null;
  subscription_amount: number;
  status: "active" | "inactive" | "suspended";
  project_count: number;
  invoice_count: number;
  outstanding_balance: number;
  account_manager?: {
    full_name: string | null;
  } | null;
};

export function CustomerTable({ customers }: { customers: CustomerRow[] }) {
  if (customers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/80 p-10 text-center shadow-sm shadow-indigo-100">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Building2 className="size-5" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-900">No customers found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try a different search or create the first customer account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="block rounded-3xl border border-white/80 bg-white/95 p-4 shadow-sm shadow-indigo-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <CustomerAvatar customer={customer} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {customer.company_name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {customer.industry || customer.business_type || "Customer account"}
                  </p>
                </div>
              </div>
              <StatusPill status={customer.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <MobileMetric label="Projects" value={String(customer.project_count)} />
              <MobileMetric label="Invoices" value={String(customer.invoice_count)} />
              <MobileMetric label="Subscription" value={formatCurrency(customer.subscription_amount)} />
              <MobileMetric
                label="Outstanding"
                value={formatCurrency(customer.outstanding_balance)}
                danger={customer.outstanding_balance > 0}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <div className="min-w-0">
                <p className="truncate">{customer.contact_person || "No primary contact"}</p>
                <p className="truncate">{customer.phone || customer.email || "No contact detail"}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-indigo-500" />
            </div>
          </Link>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-indigo-100/50 lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead className="text-center">Projects</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-indigo-50/40">
                  <td className="px-4 py-4">
                    <div className="flex min-w-64 items-center gap-3">
                      <CustomerAvatar customer={customer} />
                      <div className="min-w-0">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="truncate text-sm font-semibold text-slate-950 hover:text-indigo-700"
                        >
                          {customer.company_name}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer.customer_code || "No customer code"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-slate-800">
                        {customer.contact_person || "-"}
                      </p>
                      <ContactLine icon={<Phone className="size-3" />} value={customer.phone} />
                      <ContactLine icon={<Mail className="size-3" />} value={customer.email} />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{customer.industry || customer.business_type || "-"}</p>
                      <p className="capitalize text-slate-500">
                        {customer.plan_type ? `${customer.plan_type} plan` : "No plan"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {customer.account_manager?.full_name || "Unassigned"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
                    {customer.project_count}
                  </td>
                  <td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
                    {customer.invoice_count}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold">
                    <span className={customer.outstanding_balance > 0 ? "text-red-600" : "text-emerald-600"}>
                      {formatCurrency(customer.outstanding_balance)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={customer.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/customers/${customer.id}`}>Open</Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link href={`/customers/${customer.id}/edit`} aria-label={`Edit ${customer.company_name}`}>
                          <MoreHorizontal className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CustomerAvatar({ customer }: { customer: CustomerRow }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 text-sm font-bold uppercase text-indigo-700">
      {initials(customer.company_name)}
    </div>
  );
}

function StatusPill({ status }: { status: CustomerRow["status"] }) {
  const className =
    status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "suspended"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={`capitalize ${className}`}>
      {status}
    </Badge>
  );
}

function TableHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

function ContactLine({ icon, value }: { icon: ReactNode; value: string | null }) {
  if (!value) return null;

  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-500">
      {icon}
      <span className="max-w-44 truncate">{value}</span>
    </p>
  );
}

function MobileMetric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${danger ? "text-red-600" : "text-slate-950"}`}>
        {value}
      </p>
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
