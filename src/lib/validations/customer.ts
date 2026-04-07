import { z } from "zod";

export const convertLeadToCustomerSchema = z.object({
  plan_type: z.enum(["cloud", "offline"]),
  setup_fee: z.coerce.number().min(0, "Setup fee cannot be negative"),
  subscription_amount: z.coerce
    .number()
    .min(0, "Subscription amount cannot be negative"),
  billing_cycle: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
});

export const updateCustomerStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  notes: z.string().optional(),
});