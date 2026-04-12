import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type SupplierRow = {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  is_active: boolean;
};

export default async function SuppliersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suppliers")
    .select("id, supplier_code, company_name, contact_person, phone, is_active")
    .order("company_name");

  const suppliers = (data ?? []) as SupplierRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Suppliers
          </h2>
          <p className="text-slate-600">
            Manage vendors and purchasing partners.
          </p>
        </div>

        <Button asChild>
          <Link href="/suppliers/new">Add Supplier</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load suppliers: {error.message}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No suppliers found.
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{supplier.company_name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {supplier.supplier_code} · {supplier.contact_person || "-"} · {supplier.phone || "-"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}