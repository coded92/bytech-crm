import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { DocumentShell } from "@/components/shared/document-shell";
import { DocumentInfoRow } from "@/components/shared/document-info-row";
import {
  DocumentSection,
  DocumentStatusStamp,
  DocumentTable,
  DocumentTotals,
} from "@/components/shared/document-primitives";

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
  const payableSummary = getPayableAgingSummary(rows);
  const paymentSummary = getPaymentStatusSummary(rows);
  const statementStatus =
    totalBalance > 0
      ? { label: "Payable Balance", tone: "warning" as const }
      : { label: "Paid / Settled", tone: "success" as const };

  return (
    <DocumentShell
      title="Supplier Statement"
      documentNumber={supplier.supplier_code}
    >
      <div className="space-y-9">
        <section className="document-avoid-break grid gap-6 border-y border-slate-950 py-6 md:grid-cols-[1.4fr_0.8fr] print:grid-cols-[1.4fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Supplier Account Statement
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-950">
              {formatCurrency(totalBalance)}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Outstanding payable balance for {supplier.company_name}. This
              statement summarizes restock orders, recorded payments, and open
              payables in BYTECH CRM.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end print:items-end">
            <DocumentStatusStamp
              status={statementStatus.label}
              tone={statementStatus.tone}
            />
            <div className="w-full border border-slate-200 p-4 md:max-w-xs print:max-w-xs">
              <DocumentInfoRow
                label="Statement Scope"
                value="All available restock orders"
              />
              <div className="mt-4">
                <DocumentInfoRow
                  label="Generated On"
                  value={formatDateTime(new Date().toISOString())}
                />
              </div>
            </div>
          </div>
        </section>

        <DocumentSection title="Supplier / Vendor Account">
          <div className="grid gap-5 border border-slate-200 p-5 md:grid-cols-3 print:grid-cols-3">
            <DocumentInfoRow label="Company" value={supplier.company_name} />
            <DocumentInfoRow label="Supplier Code" value={supplier.supplier_code} />
            <DocumentInfoRow label="Contact" value={supplier.contact_person || "-"} />
            <DocumentInfoRow label="Phone" value={supplier.phone || "-"} />
            <DocumentInfoRow label="Email" value={supplier.email || "-"} />
            <DocumentInfoRow label="Supplier ID" value={supplier.id} />
          </div>
        </DocumentSection>

        <DocumentSection title="Payables Summary">
          <DocumentTotals
            className="max-w-none"
            rows={[
              { label: "Total Restock Orders", value: formatCurrency(totalAmount) },
              { label: "Amount Paid", value: formatCurrency(totalPaid) },
              {
                label: "Outstanding Payable",
                value: formatCurrency(totalBalance),
                strong: true,
              },
            ]}
          />
        </DocumentSection>

        <DocumentSection
          title="Payment Status Summary"
          description="Restock orders grouped by recorded payment status."
        >
          <DocumentTable>
            <thead>
              <tr>
                <th>Status</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unpaid</td>
                <td className="text-right">{paymentSummary.unpaid.count}</td>
                <td className="text-right">
                  {formatCurrency(paymentSummary.unpaid.balance)}
                </td>
              </tr>
              <tr>
                <td>Part Paid</td>
                <td className="text-right">{paymentSummary.partPaid.count}</td>
                <td className="text-right">
                  {formatCurrency(paymentSummary.partPaid.balance)}
                </td>
              </tr>
              <tr>
                <td>Paid</td>
                <td className="text-right">{paymentSummary.paid.count}</td>
                <td className="text-right">
                  {formatCurrency(paymentSummary.paid.balance)}
                </td>
              </tr>
            </tbody>
          </DocumentTable>
        </DocumentSection>

        <DocumentSection
          title="Payable Aging Summary"
          description="Open supplier balances grouped by restock order date."
        >
          <DocumentTable>
            <thead>
              <tr>
                <th className="w-1/4">Current</th>
                <th className="w-1/4 text-right">1-30 Days</th>
                <th className="w-1/4 text-right">31-60 Days</th>
                <th className="w-1/4 text-right">61+ Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatCurrency(payableSummary.current)}</td>
                <td className="text-right">
                  {formatCurrency(payableSummary.days1To30)}
                </td>
                <td className="text-right">
                  {formatCurrency(payableSummary.days31To60)}
                </td>
                <td className="text-right">
                  {formatCurrency(payableSummary.days61Plus)}
                </td>
              </tr>
            </tbody>
          </DocumentTable>
        </DocumentSection>

        <DocumentSection
          title="Restock Orders / Payables"
          description="Restock orders included in this supplier statement."
        >
          {rows.length > 0 ? (
            <DocumentTable>
              <thead>
                <tr>
                  <th>Restock No.</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const balance = getRestockBalance(row);

                  return (
                    <tr key={row.id}>
                      <td className="font-medium text-slate-950">
                        {row.restock_number}
                      </td>
                      <td>{formatDate(row.order_date)}</td>
                      <td className="capitalize">
                        {row.payment_status.replace("_", " ")}
                      </td>
                      <td className="text-right">
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(row.paid_amount)}
                      </td>
                      <td className="text-right font-semibold text-slate-950">
                        {formatCurrency(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DocumentTable>
          ) : (
            <p className="border border-slate-200 p-4 text-sm text-slate-600">
              No restock orders were found for this supplier statement.
            </p>
          )}
        </DocumentSection>

        <DocumentSection title="Statement Notes">
          <div className="border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            This supplier statement is generated from restock orders and recorded
            supplier payments in BYTECH CRM. Opening balances, credits, and
            external adjustments are not shown unless represented by restock
            order payment records in this statement scope.
          </div>
        </DocumentSection>
      </div>
    </DocumentShell>
  );
}

function getRestockBalance(row: RestockRow) {
  return Math.max(
    0,
    Number(row.total_amount || 0) - Number(row.paid_amount || 0)
  );
}

function getPayableAgingSummary(rows: RestockRow[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return rows.reduce(
    (summary, row) => {
      const balance = getRestockBalance(row);

      if (balance <= 0) {
        return summary;
      }

      const orderDate = new Date(row.order_date);
      const orderDay = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      ).getTime();
      const daysOpen = Math.floor((today - orderDay) / 86_400_000);

      if (daysOpen <= 0) {
        summary.current += balance;
      } else if (daysOpen <= 30) {
        summary.days1To30 += balance;
      } else if (daysOpen <= 60) {
        summary.days31To60 += balance;
      } else {
        summary.days61Plus += balance;
      }

      return summary;
    },
    {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61Plus: 0,
    }
  );
}

function getPaymentStatusSummary(rows: RestockRow[]) {
  return rows.reduce(
    (summary, row) => {
      const balance = getRestockBalance(row);

      if (row.payment_status === "paid") {
        summary.paid.count += 1;
        summary.paid.balance += balance;
      } else if (row.payment_status === "part_paid") {
        summary.partPaid.count += 1;
        summary.partPaid.balance += balance;
      } else {
        summary.unpaid.count += 1;
        summary.unpaid.balance += balance;
      }

      return summary;
    },
    {
      unpaid: { count: 0, balance: 0 },
      partPaid: { count: 0, balance: 0 },
      paid: { count: 0, balance: 0 },
    }
  );
}
