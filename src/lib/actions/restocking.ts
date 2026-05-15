"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { postStockMovement } from "@/lib/inventory/stock-integrity";
import {
  createRestockOrderSchema,
  updateRestockStatusSchema,
} from "@/lib/validations/restocking";

type RestockRow = {
  id: string;
};

type RestockItem = {
  inventory_item_id: string;
  quantity: number;
  unit_cost: number;
  notes?: string;
};

async function updateRestockPaymentSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restockOrderId: string
) {
  const { data: expenseRows } = await (supabase as any)
    .from("expenses")
    .select("amount")
    .eq("restock_order_id", restockOrderId);

  const paidAmount = (expenseRows ?? []).reduce(
    (sum: number, item: { amount: number }) => sum + Number(item.amount || 0),
    0
  );

  const { data: restockRow } = await (supabase as any)
    .from("inventory_restock_orders")
    .select("total_amount")
    .eq("id", restockOrderId)
    .maybeSingle();

  const totalAmount = Number(restockRow?.total_amount || 0);

  let paymentStatus: "unpaid" | "part_paid" | "paid" = "unpaid";

  if (paidAmount > 0 && paidAmount < totalAmount) {
    paymentStatus = "part_paid";
  } else if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "paid";
  }

  await (supabase as any)
    .from("inventory_restock_orders")
    .update({
      paid_amount: paidAmount,
      payment_status: paymentStatus,
    })
    .eq("id", restockOrderId);
}

export async function createRestockOrderAction(formData: FormData) {
  const supabase = await createClient();
  const profile = await requirePermission("restocking", "create");

  let items: RestockItem[] = [];
  try {
    items = JSON.parse(String(formData.get("items") || "[]"));
  } catch {
    return { error: "Invalid restock items" };
  }

  const parsed = createRestockOrderSchema.safeParse({
    supplier_id: formData.get("supplier_id") || undefined,
    status: formData.get("status"),
    order_date: formData.get("order_date"),
    expected_date: formData.get("expected_date") || undefined,
    received_date: formData.get("received_date") || undefined,
    reference: formData.get("reference") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid restock order data",
    };
  }

  const values = parsed.data;
  const totalAmount = values.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost),
    0
  );

  const { data, error } = await (supabase as any)
    .from("inventory_restock_orders")
    .insert({
      supplier_id: values.supplier_id || null,
      status: values.status === "received" ? "ordered" : values.status,
      order_date: values.order_date,
      expected_date: values.expected_date || null,
      received_date: values.status === "received" ? null : values.received_date || null,
      reference: values.reference || null,
      notes: values.notes || null,
      total_amount: totalAmount,
      created_by: profile.id,
    })
    .select("id")
    .single();

  const order = data as RestockRow | null;

  if (error || !order) {
    return { error: error?.message ?? "Failed to create restock order" };
  }

  const itemRows = values.items.map((item) => ({
    restock_order_id: order.id,
    inventory_item_id: item.inventory_item_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    notes: item.notes || null,
  }));

  const { error: itemError } = await (supabase as any)
    .from("inventory_restock_order_items")
    .insert(itemRows);

  if (itemError) {
    return { error: itemError.message };
  }

  if (values.status === "received") {
    const appliedItems: RestockItem[] = [];

    for (const item of values.items) {
      const movementResult = await postStockMovement({
        supabase,
        inventoryItemId: item.inventory_item_id,
        movementType: "stock_in",
        quantity: item.quantity,
        unitCost: item.unit_cost,
        note: `Restock received: ${order.id}`,
        actorId: profile.id,
      });

      if ("error" in movementResult) {
        for (const appliedItem of appliedItems.reverse()) {
          await postStockMovement({
            supabase,
            inventoryItemId: appliedItem.inventory_item_id,
            movementType: "stock_out",
            quantity: appliedItem.quantity,
            unitCost: appliedItem.unit_cost,
            note: `Rollback failed restock receipt: ${order.id}`,
            actorId: profile.id,
          });
        }

        return { error: movementResult.error };
      }

      appliedItems.push(item);
    }

    const { error: receiveError } = await (supabase as any)
      .from("inventory_restock_orders")
      .update({
        status: "received",
        received_date: values.received_date || new Date().toISOString().slice(0, 10),
      })
      .eq("id", order.id)
      .eq("status", "ordered");

    if (receiveError) {
      return { error: receiveError.message };
    }
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "restock_order",
    entity_id: order.id,
    action: "created",
    description: "Created restock order",
  });

  revalidatePath("/restocking");
  revalidatePath("/inventory");
  redirect(`/restocking/${order.id}`);
}

export async function updateRestockOrderStatusAction(
  orderId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const profile = await requirePermission("restocking", "update");

  const parsed = updateRestockStatusSchema.safeParse({
    status: formData.get("status"),
    received_date: formData.get("received_date") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status update" };
  }

  const values = parsed.data;

  const { data: existingOrderData } = await (supabase as any)
    .from("inventory_restock_orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!existingOrderData) {
    return { error: "Restock order not found" };
  }

  const existingOrder = existingOrderData as {
    id: string;
    status: "draft" | "ordered" | "received" | "cancelled";
  };

  const isReceiving =
    existingOrder.status !== "received" && values.status === "received";

  const { data: statusUpdateData, error } = await (supabase as any)
    .from("inventory_restock_orders")
    .update({
      status: values.status,
      received_date: values.received_date || null,
    })
    .eq("id", orderId)
    .eq("status", existingOrder.status)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!statusUpdateData) {
    return {
      error: "Restock order was updated by another user. Please refresh and try again.",
    };
  }

  if (isReceiving) {
    const { data: itemsData } = await (supabase as any)
      .from("inventory_restock_order_items")
      .select("inventory_item_id, quantity, unit_cost")
      .eq("restock_order_id", orderId);

    const items = (itemsData ?? []) as Array<{
      inventory_item_id: string;
      quantity: number;
      unit_cost: number;
    }>;

    const appliedItems: typeof items = [];

    for (const item of items) {
      const movementResult = await postStockMovement({
        supabase,
        inventoryItemId: item.inventory_item_id,
        movementType: "stock_in",
        quantity: item.quantity,
        unitCost: item.unit_cost,
        note: `Restock received: ${orderId}`,
        actorId: profile.id,
      });

      if ("error" in movementResult) {
        for (const appliedItem of appliedItems.reverse()) {
          await postStockMovement({
            supabase,
            inventoryItemId: appliedItem.inventory_item_id,
            movementType: "stock_out",
            quantity: appliedItem.quantity,
            unitCost: appliedItem.unit_cost,
            note: `Rollback failed restock receipt: ${orderId}`,
            actorId: profile.id,
          });
        }

        await (supabase as any)
          .from("inventory_restock_orders")
          .update({
            status: existingOrder.status,
            received_date: null,
          })
          .eq("id", orderId)
          .eq("status", "received");

        return { error: movementResult.error };
      }

      appliedItems.push(item);
    }
  }

  revalidatePath("/restocking");
  revalidatePath(`/restocking/${orderId}`);
  revalidatePath("/inventory");

  return { success: true };
}
