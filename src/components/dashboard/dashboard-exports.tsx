import { ExportCsvButton } from "@/components/shared/export-csv-button";

type DashboardExportsProps = {
  invoiceRows: Array<Array<string | number | null | undefined>>;
  expenseRows: Array<Array<string | number | null | undefined>>;
};

export function DashboardExports({
  invoiceRows,
  expenseRows,
}: DashboardExportsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">
        Quick Exports
      </h3>

      <div className="flex flex-wrap gap-3">
        <ExportCsvButton
          filename="dashboard-invoices.csv"
          headers={[
            "Invoice Number",
            "Customer",
            "Type",
            "Status",
            "Amount",
            "Amount Paid",
            "Balance",
          ]}
          rows={invoiceRows}
          label="Export Invoices"
        />

        <ExportCsvButton
          filename="dashboard-expenses.csv"
          headers={["Title", "Category", "Amount", "Expense Date", "Notes"]}
          rows={expenseRows}
          label="Export Expenses"
        />
      </div>
    </div>
  );
}