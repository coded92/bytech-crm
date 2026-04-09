import { z } from "zod";

export const createRepairHistorySchema = z.object({
  asset_id: z.string().min(1, "Asset is required"),
  support_ticket_id: z.string().optional(),
  repair_title: z.string().min(3, "Repair title is required"),
  repair_type: z.enum([
    "inspection",
    "repair",
    "replacement",
    "maintenance",
    "other",
  ]),
  repair_status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  technician_id: z.string().optional(),
  cost: z.coerce.number().min(0),
  repair_date: z.string().min(1, "Repair date is required"),
  notes: z.string().optional(),
});