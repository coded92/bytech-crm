import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate } from "@/lib/utils/format-date";

type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  category:
    | "operations"
    | "salaries"
    | "transport"
    | "marketing"
    | "utilities"
    | "repair_materials"
    | "other";
  expense_date: string;
  notes: string | null;
};

export function ExpenseTable({ expenses }: { expenses: ExpenseRow[] }) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No expenses found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:hidden">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{expense.title}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {expense.category.replaceAll("_", " ")}
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Date: {formatDate(expense.expense_date)}</p>
              <p>Notes: {expense.notes || "-"}</p>
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
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-4 text-sm font-medium text-slate-900">
                    {expense.title}
                  </td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">
                    {expense.category.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDate(expense.expense_date)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {expense.notes || "-"}
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