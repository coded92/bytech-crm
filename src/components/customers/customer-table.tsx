import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Badge } from "@/components/ui/badge";

type CustomerRow = {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  plan_type: "cloud" | "offline";
  subscription_amount: number;
  status: "active" | "inactive" | "suspended";
  account_manager?: {
    full_name: string | null;
  } | null;
};

export function CustomerTable({ customers }: { customers: CustomerRow[] }) {
  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No customers found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {customer.company_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {customer.customer_code}
                </p>
              </div>

              <Badge variant="outline" className="capitalize">
                {customer.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Contact: {customer.contact_person || "-"}</p>
              <p>Phone: {customer.phone || "-"}</p>
              <p>Plan: {customer.plan_type}</p>
              <p>Subscription: {formatCurrency(customer.subscription_amount)}</p>
              <p>Manager: {customer.account_manager?.full_name || "-"}</p>
            </div>

            <div className="mt-4">
              <Link
                href={`/customers/${customer.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Customer
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subscription
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Manager
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-4 text-sm text-slate-900">
                    {customer.customer_code}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {customer.company_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <div>{customer.contact_person || "-"}</div>
                    <div className="text-xs text-slate-500">
                      {customer.phone || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {customer.plan_type}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(customer.subscription_amount)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {customer.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {customer.account_manager?.full_name || "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-sm font-medium text-slate-900 underline underline-offset-4"
                    >
                      View
                    </Link>
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