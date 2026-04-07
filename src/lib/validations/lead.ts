import { z } from "zod";

export const leadFormSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_person: z.string().min(2, "Contact person is required"),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((value) => !value || /\S+@\S+\.\S+/.test(value), {
      message: "Enter a valid email address",
    }),
  business_type: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source_id: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum([
    "new",
    "contacted",
    "interested",
    "follow_up",
    "closed_won",
    "closed_lost",
  ]),
  estimated_value: z.coerce.number().min(0, "Estimated value cannot be negative"),
  interested_plan: z.enum(["cloud", "offline", "unknown"]),
  next_follow_up_at: z.string().optional(),
  lost_reason: z.string().optional(),
});

export const leadNoteSchema = z.object({
  note: z.string().min(2, "Note is required"),
  note_type: z.enum(["call", "meeting", "whatsapp", "email", "general"]),
  follow_up_date: z.string().optional(),
});

export const leadStatusSchema = z.object({
  status: z.enum([
    "new",
    "contacted",
    "interested",
    "follow_up",
    "closed_won",
    "closed_lost",
  ]),
  lost_reason: z.string().optional(),
  next_follow_up_at: z.string().optional(),
});