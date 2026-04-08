import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { Button } from "@/components/ui/button";

export default async function ExpensesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("id, title, amount, category, expense_date, notes")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Expenses
          </h2>
          <p className="text-slate-600">
            Track company spending and operational costs.
          </p>
        </div>

        {profile.role === "admin" ? (
          <Button asChild>
            <Link href="/expenses/new">Add Expense</Link>
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load expenses: {error.message}
        </div>
      ) : (
        <ExpenseTable expenses={expenses || []} />
      )}
    </div>
  );
}