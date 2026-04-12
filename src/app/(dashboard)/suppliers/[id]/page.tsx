import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SupplierRow = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RestockRow = {
  id: string;
  restock_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: "unpaid" | "part_paid" | "paid";
  created_at: string;
};

export default async function SupplierDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: supplierData }, { data: restocksData }] = await Promise.all([
    supabase
      .from("suppliers")
      .select(
        "id, company_name, contact_person, email, phone, address, city, state, notes, is_active, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("inventory_restock_orders")
      .select(
        "id, restock_number, status, total_amount, paid_amount, payment_status, created_at"
      )
      .eq("supplier_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!supplierData) {
    notFound();
  }

  const supplier = supplierData as SupplierRow;
  const restocks = (restocksData ?? []) as RestockRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {supplier.company_name}
          </h2>
          <p className="text-slate-600">
            {supplier.is_active ? "Active supplier" : "Inactive supplier"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button asChild variant="outline">
            <Link href={`/suppliers/${supplier.id}/statement`}>
              Supplier Statement
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoItem label="Contact Person" value={supplier.contact_person || "-"} />
          <InfoItem label="Email" value={supplier.email || "-"} />
          <InfoItem label="Phone" value={supplier.phone || "-"} />
          <InfoItem label="City" value={supplier.city || "-"} />
          <InfoItem label="State" value={supplier.state || "-"} />
          <InfoItem label="Address" value={supplier.address || "-"} />
          <InfoItem
            label="Status"
            value={supplier.is_active ? "active" : "inactive"}
          />
          <InfoItem
            label="Updated At"
            value={formatDateTime(supplier.updated_at)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {supplier.notes || "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restock History</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {restocks.length === 0 ? (
            <p className="text-sm text-slate-500">No restock orders yet.</p>
          ) : (
            restocks.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {item.restock_number}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  <span className="capitalize">{item.status}</span> ·{" "}
                  <span>Total: {formatCurrency(item.total_amount || 0)}</span> ·{" "}
                  <span>Paid: {formatCurrency(item.paid_amount || 0)}</span> ·{" "}
                  <span className="capitalize">{item.payment_status}</span> ·{" "}
                  <span>{formatDateTime(item.created_at)}</span>
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value}</p>
    </div>
  );
}