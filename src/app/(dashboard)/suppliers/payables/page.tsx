import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";

type PayableRow = {
  id: string;
  restock_number: string;
  total_amount: number;
  paid_amount: number;
  payment_status: "unpaid" | "part_paid" | "paid";
  supplier: {
    id: string | null;
    company_name: string | null;
  } | null;
};

export default async function SupplierPayablesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_restock_orders")
    .select(`
      id,
      restock_number,
      total_amount,
      paid_amount,
      payment_status,
      supplier:suppliers(id, company_name)
    `)
    .in("payment_status", ["unpaid", "part_paid"])
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as PayableRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Supplier Payables
        </h2>
        <p className="text-slate-600">
          Outstanding balances owed to suppliers.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load payables: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No outstanding supplier payables.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const balance = Math.max(
              0,
              Number(row.total_amount || 0) - Number(row.paid_amount || 0)
            );

            return (
              <Link
                key={row.id}
                href={`/restocking/${row.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="font-medium text-slate-900">{row.restock_number}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {row.supplier?.company_name || "-"} · {row.payment_status}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Total: {formatCurrency(row.total_amount)} · Paid: {formatCurrency(row.paid_amount)} · Balance: {formatCurrency(balance)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}