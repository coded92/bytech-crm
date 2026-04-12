import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type SupplierRow = {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
};

export function SupplierTable({ suppliers }: { suppliers: SupplierRow[] }) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No suppliers found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {supplier.company_name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {supplier.supplier_code}
                </p>
              </div>

              <Badge variant="outline" className="capitalize">
                {supplier.is_active ? "active" : "inactive"}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Contact: {supplier.contact_person || "-"}</p>
              <p>Email: {supplier.email || "-"}</p>
              <p>Phone: {supplier.phone || "-"}</p>
              <p>
                Location: {[supplier.city, supplier.state].filter(Boolean).join(", ") || "-"}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Link
                href={`/suppliers/${supplier.id}`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                View Supplier
              </Link>

              <Link
                href={`/suppliers/${supplier.id}/edit`}
                className="text-sm font-medium text-slate-900 underline underline-offset-4"
              >
                Edit Supplier
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
                  Supplier Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-4 py-4 text-sm text-slate-900">
                    {supplier.supplier_code}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {supplier.company_name}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <div>{supplier.contact_person || "-"}</div>
                    <div className="text-xs text-slate-500">
                      {supplier.email || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {supplier.phone || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {[supplier.city, supplier.state].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {supplier.is_active ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/suppliers/${supplier.id}/edit`}
                        className="text-sm font-medium text-slate-900 underline underline-offset-4"
                      >
                        Edit
                      </Link>
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