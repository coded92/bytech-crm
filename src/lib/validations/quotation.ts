import { z } from "zod";

export const quotationItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Unit price cannot be negative"),
});

export const createQuotationSchema = z.object({
  lead_id: z.string().optional(),
  customer_id: z.string().optional(),
  company_name: z.string().min(2, "Company name is required"),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  valid_until: z.string().optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  tax: z.coerce.number().min(0, "Tax cannot be negative"),
  notes: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "Add at least one item"),
});

export const quotationStatusSchema = z.object({
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
});