"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createExpenseSchema } from "@/lib/validations/expense";
import type { Database } from "@/types/database";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ActivityLogInsert = Database["public"]["Tables"]["activity_logs"]["Insert"];

async function updateRestockPaymentSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restockOrderId: string
) {
  const { data: expenseRows, error: expensesError } = await (supabase as any)
    .from("expenses")
    .select("amount")
    .eq("restock_order_id", restockOrderId);

  if (expensesError) {
    throw new Error(expensesError.message);
  }

  const paidAmount = (expenseRows ?? []).reduce(
    (sum: number, item: { amount: number | string | null }) =>
      sum + Number(item.amount || 0),
    0
  );

  const { data: restockRow, error: restockError } = await (supabase as any)
    .from("inventory_restock_orders")
    .select("total_amount")
    .eq("id", restockOrderId)
    .maybeSingle();

  if (restockError) {
    throw new Error(restockError.message);
  }

  const totalAmount = Number(restockRow?.total_amount || 0);

  let paymentStatus: "unpaid" | "part_paid" | "paid" = "unpaid";

  if (paidAmount > 0 && paidAmount < totalAmount) {
    paymentStatus = "part_paid";
  } else if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "paid";
  }

  const { error: updateError } = await (supabase as any)
    .from("inventory_restock_orders")
    .update({
      paid_amount: paidAmount,
      payment_status: paymentStatus,
    })
    .eq("id", restockOrderId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

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

  const payload = {
    title: values.title,
    amount: values.amount,
    category: values.category,
    expense_date: values.expense_date,
    notes: values.notes || null,
    created_by: user.id,
  } as ExpenseInsert;

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

  const { error: activityError } =
    await activityLogsTable.insert(activityPayload);

  if (activityError) {
    throw new Error(activityError.message);
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function createSupplierPurchaseExpenseAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const supplierId = String(formData.get("supplier_id") || "");
  const restockOrderId = String(formData.get("restock_order_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const description = String(formData.get("description") || "");
  const expenseDate = String(formData.get("expense_date") || "");
  const paymentMethod = String(formData.get("payment_method") || "transfer");

  if (!supplierId) {
    return { error: "Supplier is required" };
  }

  if (!restockOrderId) {
    return { error: "Restock order is required" };
  }

  if (!amount || amount <= 0) {
    return { error: "Amount must be greater than zero" };
  }

  if (!expenseDate) {
    return { error: "Expense date is required" };
  }

  const { error } = await (supabase as any).from("expenses").insert({
    title: description || "Supplier purchase payment",
    amount,
    category: "inventory",
    expense_date: expenseDate,
    notes: description || null,
    payment_method: paymentMethod,
    supplier_id: supplierId,
    restock_order_id: restockOrderId,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  await updateRestockPaymentSummary(supabase, restockOrderId);

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "restock_order",
    entity_id: restockOrderId,
    action: "supplier_payment_recorded",
    description: `Recorded supplier payment of ${amount}`,
  });

  revalidatePath("/expenses");
  revalidatePath(`/restocking/${restockOrderId}`);
  revalidatePath(`/suppliers/${supplierId}`);

  return { success: true };
}

export async function updateExpenseAction(
  expenseId: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: profileError.message };
  }

  const profile = profileData as { role: "admin" | "staff" } | null;

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can edit expenses." };
  }

  const parsed = createExpenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    expense_date: formData.get("expense_date"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid expense data",
    };
  }

  const values = parsed.data;

  const { error } = await (supabase as any)
    .from("expenses")
    .update({
      title: values.title,
      amount: values.amount,
      category: values.category,
      expense_date: values.expense_date,
      notes: values.notes || null,
    })
    .eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "expense",
    entity_id: expenseId,
    action: "updated",
    description: `Updated expense: ${values.title}`,
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}`);
  revalidatePath(`/expenses/${expenseId}/edit`);
  revalidatePath("/dashboard");

  redirect("/expenses");
}