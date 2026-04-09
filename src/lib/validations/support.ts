import { z } from "zod";

export const createSupportTicketSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  asset_id: z.string().optional(),
  title: z.string().min(3, "Ticket title is required"),
  issue_type: z.enum([
    "hardware",
    "software",
    "network",
    "training",
    "billing",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  assigned_to: z.string().optional(),
  resolution_notes: z.string().optional(),
});