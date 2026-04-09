import { z } from "zod";

export const createAssetSchema = z.object({
  device_type: z.enum(["pos_terminal", "printer", "scanner", "router", "other"]),
  serial_number: z.string().optional(),
  customer_id: z.string().optional(),
  branch_id: z.string().optional(),
  deployment_id: z.string().optional(),
  condition: z.enum(["new", "good", "faulty", "under_repair", "retired"]),
  status: z.enum(["active", "inactive", "lost", "retired"]),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
});