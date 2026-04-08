"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createExpenseSchema } from "@/lib/validations/expense";
import type { Database } from "@/types/database";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

export async function createExpenseAction(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profile = profileData as { role: "admin" | "staff" } | null;

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can add expenses.");
  }

  const parsed = createExpenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    expense_date: formData.get("expense_date"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Invalid expense data"
    );
  }

  const values = parsed.data;

  const expensesTable = supabase.from("expenses") as unknown as {
    insert: (
      values: ExpenseInsert | ExpenseInsert[]
    ) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: Pick<ExpenseRow, "id"> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  const payload: ExpenseInsert = {
    title: values.title,
    amount: values.amount,
    category: values.category,
    expense_date: values.expense_date,
    notes: values.notes || null,
    created_by: user.id,
  };

  const { data: expense, error } = await expensesTable
    .insert(payload)
    .select("id")
    .single();

  if (error || !expense) {
    throw new Error(error?.message ?? "Failed to create expense");
  }

  const activityLogsTable = supabase.from("activity_logs") as unknown as {
    insert: (values: ActivityLogInsert | ActivityLogInsert[]) => Promise<{
      error: { message: string } | null;
    }>;
  };

  const activityPayload: ActivityLogInsert = {
    actor_id: user.id,
    entity_type: "expense",
    entity_id: expense.id,
    action: "created",
    description: `Created expense: ${values.title}`,
  };

  const { error: activityError } = await activityLogsTable.insert(activityPayload);

  if (activityError) {
    throw new Error(activityError.message);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}