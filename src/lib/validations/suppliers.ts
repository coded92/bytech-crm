import { z } from "zod";

export const createSupplierSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});