import { z } from "zod";

export const restockItemSchema = z.object({
  inventory_item_id: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  notes: z.string().optional(),
});

export const createRestockOrderSchema = z.object({
  supplier_id: z.string().optional(),
  status: z.enum(["draft", "ordered", "received", "cancelled"]),
  order_date: z.string().min(1, "Order date is required"),
  expected_date: z.string().optional(),
  received_date: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(restockItemSchema).min(1, "Add at least one item"),
});

export const updateRestockStatusSchema = z.object({
  status: z.enum(["draft", "ordered", "received", "cancelled"]),
  received_date: z.string().optional(),
});