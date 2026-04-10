import { z } from "zod";

export const createInventoryItemSchema = z.object({
  item_name: z.string().min(2, "Item name is required"),
  category: z.enum([
    "cables",
    "printer_parts",
    "network_devices",
    "accessories",
    "spare_parts",
    "tools",
    "consumables",
    "other",
  ]),
  sku: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  current_quantity: z.coerce.number().min(0),
  minimum_quantity: z.coerce.number().min(0),
  unit_cost: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export const createInventoryMovementSchema = z.object({
  inventory_item_id: z.string().min(1, "Item is required"),
  movement_type: z.enum(["stock_in", "stock_out", "adjustment"]),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  unit_cost: z.coerce.number().min(0).optional(),
  field_job_id: z.string().optional(),
  note: z.string().optional(),
});