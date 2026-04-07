import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  task_type: z.enum(["follow_up", "support", "payment", "general"]),
  related_lead_id: z.string().optional(),
  related_customer_id: z.string().optional(),
  assigned_to: z.string().min(1, "Assigned staff is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  due_date: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});