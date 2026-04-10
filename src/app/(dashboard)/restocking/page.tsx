import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format-date";
import { Button } from "@/components/ui/button";

type RestockRow = {
  id: string;
  restock_number: string;
  status: "draft" | "ordered" | "received" | "cancelled";
  order_date: string;
  total_amount: number;
  supplier: {
    company_name: string | null;
  } | null;
};

export default async function RestockingPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_restock_orders")
    .select(`
      id,
      restock_number,
      status,
      order_date,
      total_amount,
      supplier:suppliers(company_name)
    `)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as RestockRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Restocking
          </h2>
          <p className="text-slate-600">
            Manage supplier purchases and inventory replenishment.
          </p>
        </div>

        <Button asChild>
          <Link href="/restocking/new">Create Restock Order</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load restock orders: {error.message}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No restock orders found.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/restocking/${order.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-slate-900">{order.restock_number}</p>
              <p className="mt-1 text-sm text-slate-500">
                {order.supplier?.company_name || "-"} · {order.status} · {formatDate(order.order_date)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}