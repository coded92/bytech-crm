import { z } from "zod";

export const createProjectSchema = z.object({
  project_name: z.string().min(2, "Project name is required"),
  customer_id: z.string().optional(),
  lead_id: z.string().optional(),
  quotation_id: z.string().optional(),
  invoice_id: z.string().optional(),
  receipt_id: z.string().optional(),
  project_type: z.enum([
    "website_development",
    "pos_deployment",
    "crm_setup",
    "digital_marketing",
    "networking_infrastructure",
    "maintenance",
    "custom_software",
    "other",
  ]),
  description: z.string().optional(),
  project_manager_id: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum([
    "proposal",
    "approved",
    "paid",
    "planning",
    "in_progress",
    "review",
    "completed",
    "maintenance",
    "on_hold",
    "cancelled",
  ]),
  quotation_amount: z.coerce.number().min(0, "Quotation amount cannot be negative"),
  amount_paid: z.coerce.number().min(0, "Amount paid cannot be negative"),
  payment_status: z.enum(["unpaid", "part_payment", "paid_in_full"]),
  invoice_number: z.string().optional(),
  receipt_number: z.string().optional(),
  recurring_revenue: z.boolean().optional(),
  annual_renewal_amount: z.coerce.number().min(0).optional(),
  next_renewal_date: z.string().optional(),
  project_cost_estimate: z.coerce.number().min(0).optional(),
  progress: z.coerce.number().min(0).max(100),
});

export const projectTaskSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed", "blocked", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
});

export const updateProjectTaskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "completed", "blocked", "cancelled"]),
});

export const projectTimelineSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  timeline_type: z.string().min(1, "Timeline type is required"),
  title: z.string().min(2, "Title is required"),
  note: z.string().optional(),
});