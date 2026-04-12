import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";

type SupplierStatementPageProps = {
  params: Promise<{ id: string }>;
};

type SupplierRow = {
  id: string;
  supplier_code: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
};

type RestockRow = {
  id: string;
  restock_number: string;
  order_date: string;
  total_amount: number;
  paid_amount: number;
  payment_status: "unpaid" | "part_paid" | "paid";
};

export default async function SupplierStatementPage({
  params,
}: SupplierStatementPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: supplierData }, { data: rowsData }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("id, supplier_code, company_name, contact_person, phone, email")
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("inventory_restock_orders")
      .select("id, restock_number, order_date, total_amount, paid_amount, payment_status")
      .eq("supplier_id", id)
      .order("order_date", { ascending: false }),
  ]);

  if (!supplierData) {
    notFound();
  }

  const supplier = supplierData as SupplierRow;
  const rows = (rowsData ?? []) as RestockRow[];

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const totalPaid = rows.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
  const totalBalance = Math.max(0, totalAmount - totalPaid);

  return (
    <DocumentShell
      title="Supplier Statement"
      documentNumber={supplier.supplier_code}
    >
      <div className="space-y-8">
        <div className="rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Supplier Information</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <DocumentInfoRow label="Company" value={supplier.company_name} />
            <DocumentInfoRow label="Contact" value={supplier.contact_person || "-"} />
            <DocumentInfoRow label="Phone" value={supplier.phone || "-"} />
            <DocumentInfoRow label="Email" value={supplier.email || "-"} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryBox label="Total Purchases" value={formatCurrency(totalAmount)} />
          <SummaryBox label="Total Paid" value={formatCurrency(totalPaid)} />
          <SummaryBox label="Balance Due" value={formatCurrency(totalBalance)} />
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Transaction History
          </h3>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Restock No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const balance = Math.max(
                    0,
                    Number(row.total_amount || 0) - Number(row.paid_amount || 0)
                  );

                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        {row.restock_number}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(row.order_date)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatCurrency(row.paid_amount)}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}