import { requireAdmin } from "@/lib/auth/require-admin";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Add Expense
        </h2>
        <p className="text-slate-600">
          Record a company expense.
        </p>
      </div>

      <ExpenseForm />
    </div>
  );
}