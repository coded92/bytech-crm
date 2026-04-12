import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { ExpenseEditForm } from "@/components/expenses/expense-edit-form";

type EditExpensePageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    notFound();
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select("id, title, amount, category, expense_date, notes")
    .eq("id", id)
    .single();

  if (!expense) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Expense
        </h2>
        <p className="text-slate-600">
          Update expense details and company spending record.
        </p>
      </div>

      <ExpenseEditForm expense={expense as ExpenseRow} />
    </div>
  );
}