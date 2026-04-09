import { z } from "zod";

export const createDeploymentSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  branch_name: z.string().min(2, "Branch name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  deployment_type: z.enum([
    "new_installation",
    "upgrade",
    "replacement",
    "maintenance",
  ]),
  terminal_count: z.coerce.number().min(1, "Terminal count must be at least 1"),
  deployment_status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  deployed_by: z.string().optional(),
  install_date: z.string().optional(),
  go_live_date: z.string().optional(),
  notes: z.string().optional(),
});