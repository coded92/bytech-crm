import { z } from "zod";

export const createFieldJobSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  branch_id: z.string().optional(),
  asset_id: z.string().optional(),
  support_ticket_id: z.string().optional(),
  title: z.string().min(3, "Job title is required"),
  job_type: z.enum([
    "wiring_repair",
    "hardware_repair",
    "site_inspection",
    "site_survey",
    "site_assessment",
    "installation",
    "maintenance_visit",
    "device_replacement",
    "network_troubleshooting",
    "training_visit",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum([
    "pending",
    "assigned",
    "in_progress",
    "awaiting_parts",
    "completed",
    "cancelled",
  ]),
  assigned_engineer_id: z.string().optional(),
  scheduled_date: z.string().optional(),
  reported_issue: z.string().optional(),
  work_done: z.string().optional(),
  materials_used: z.string().optional(),
  recommendation: z.string().optional(),
  customer_feedback: z.string().optional(),
});

export const updateFieldJobSchema = createFieldJobSchema.extend({
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
});

export const createFieldJobUpdateSchema = z.object({
  field_job_id: z.string().min(1, "Field job is required"),
  note: z.string().min(2, "Update note is required"),
  status: z
    .enum([
      "pending",
      "assigned",
      "in_progress",
      "awaiting_parts",
      "completed",
      "cancelled",
    ])
    .optional(),
});

