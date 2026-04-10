"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function createRestockOrderAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

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
      status: values.status,
      order_date: values.order_date,
      expected_date: values.expected_date || null,
      received_date: values.received_date || null,
      reference: values.reference || null,
      notes: values.notes || null,
      total_amount: totalAmount,
      created_by: user.id,
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
    for (const item of values.items) {
      await (supabase as any).from("inventory_movements").insert({
        inventory_item_id: item.inventory_item_id,
        movement_type: "stock_in",
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        note: `Restock received: ${order.id}`,
        created_by: user.id,
      });
    }
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

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

  const { error } = await (supabase as any)
    .from("inventory_restock_orders")
    .update({
      status: values.status,
      received_date: values.received_date || null,
    })
    .eq("id", orderId);

  if (error) {
    return { error: error.message };
  }

  if (existingOrder.status !== "received" && values.status === "received") {
    const { data: itemsData } = await (supabase as any)
      .from("inventory_restock_order_items")
      .select("inventory_item_id, quantity, unit_cost")
      .eq("restock_order_id", orderId);

    const items = (itemsData ?? []) as Array<{
      inventory_item_id: string;
      quantity: number;
      unit_cost: number;
    }>;

    for (const item of items) {
      await (supabase as any).from("inventory_movements").insert({
        inventory_item_id: item.inventory_item_id,
        movement_type: "stock_in",
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        note: `Restock received: ${orderId}`,
        created_by: user.id,
      });
    }
  }

  revalidatePath("/restocking");
  revalidatePath(`/restocking/${orderId}`);
  revalidatePath("/inventory");

  return { success: true };
}