"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createExpenseSchema } from "@/lib/validations/expense";
import type { Database } from "@/types/database";
import { writeActivityLog } from "@/lib/logs/write-activity-log";

type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

type ActionResponse = { success: true } | { error: string };

async function requireAdminUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: "Unauthorized" };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { user: null, error: profileError.message };
  }

  const profile = profileData as { role: "admin" | "staff" } | null;

  if (!profile || profile.role !== "admin") {
    return { user: null, error: "Only admins can perform this action." };
  }

  return { user, error: null };
}

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

export async function createExpenseAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const adminCheck = await requireAdminUser(supabase);
  if (adminCheck.error || !adminCheck.user) {
    return { error: adminCheck.error ?? "Unauthorized" };
  }

  const user = adminCheck.user;

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
    supplier_id: null,
    restock_order_id: null,
    expense_date: values.expense_date,
    notes: values.notes || null,
    created_by: user.id,
  };

  const { data: expense, error } = await expensesTable
    .insert(payload)
    .select("id")
    .single();

  if (error || !expense) {
    return { error: error?.message ?? "Failed to create expense" };
  }

  await writeActivityLog({
    actorId: user.id,
    entityType: "expense",
    entityId: expense.id,
    action: "created",
    description: `Created expense: ${values.title}`,
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function createSupplierPurchaseExpenseAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const adminCheck = await requireAdminUser(supabase);
  if (adminCheck.error || !adminCheck.user) {
    return { error: adminCheck.error ?? "Unauthorized" };
  }

  const user = adminCheck.user;

  const supplierId = String(formData.get("supplier_id") || "").trim();
  const restockOrderId = String(formData.get("restock_order_id") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const description = String(formData.get("description") || "").trim();
  const expenseDate = String(formData.get("expense_date") || "").trim();
  const paymentMethod = String(
    formData.get("payment_method") || "transfer"
  ).trim();

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

  const title = description || "Supplier purchase payment";

  const payload: ExpenseInsert = {
    title,
    amount,
    category: "other",
    supplier_id: supplierId,
    restock_order_id: restockOrderId,
    expense_date: expenseDate,
    notes: `Payment method: ${paymentMethod}${description ? ` | ${description}` : ""}`,
    created_by: user.id,
  };

  const { data: expense, error } = await (supabase as any)
    .from("expenses")
    .insert(payload)
    .select("id")
    .single();

  if (error || !expense) {
    return {
      error: error?.message ?? "Failed to record supplier purchase expense",
    };
  }

  try {
    await updateRestockPaymentSummary(supabase, restockOrderId);
  } catch (summaryError) {
    return {
      error:
        summaryError instanceof Error
          ? summaryError.message
          : "Failed to update restock payment summary",
    };
  }

  await writeActivityLog({
    actorId: user.id,
    entityType: "expense",
    entityId: expense.id,
    action: "created",
    description: `Recorded supplier purchase expense: ${title}`,
  });

  await writeActivityLog({
    actorId: user.id,
    entityType: "supplier",
    entityId: supplierId,
    action: "payment_recorded",
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
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const adminCheck = await requireAdminUser(supabase);
  if (adminCheck.error || !adminCheck.user) {
    return { error: adminCheck.error ?? "Unauthorized" };
  }

  const user = adminCheck.user;

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

  await writeActivityLog({
    actorId: user.id,
    entityType: "expense",
    entityId: expenseId,
    action: "updated",
    description: `Updated expense: ${values.title}`,
  });

  revalidatePath("/expenses");
  revalidatePath(`/expenses/${expenseId}`);
  revalidatePath(`/expenses/${expenseId}/edit`);
  revalidatePath("/dashboard");

  redirect("/expenses");
}