import { z } from "zod";

export const createInvoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  quotation_id: z.string().optional(),
  invoice_type: z.enum(["setup_fee", "subscription", "custom"]),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  due_date: z.string().min(1, "Due date is required"),
  billing_period_start: z.string().optional(),
  billing_period_end: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  invoice_id: z.string().min(1, "Invoice is required"),
  customer_id: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().min(0.01, "Payment amount must be greater than zero"),
  payment_method: z.enum(["cash", "transfer", "card", "pos", "other"]),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
});