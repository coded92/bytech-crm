import { z } from "zod";

export const createFieldJobMaterialSchema = z.object({
  field_job_id: z.string().min(1, "Field job is required"),
  item_name: z.string().min(2, "Item name is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than zero"),
  unit: z.string().optional(),
  unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  notes: z.string().optional(),
});