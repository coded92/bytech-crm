import { z } from "zod";

export const createFieldJobInventoryUsageSchema = z.object({
  field_job_id: z.string().min(1, "Field job is required"),
  inventory_item_id: z.string().min(1, "Inventory item is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  notes: z.string().optional(),
});