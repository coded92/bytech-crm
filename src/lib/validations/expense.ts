import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(2, "Expense title is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than zero"),
  category: z.enum([
    "operations",
    "salaries",
    "transport",
    "marketing",
    "utilities",
    "repair_materials",
    "other",
  ]),
  expense_date: z.string().min(1, "Expense date is required"),
  notes: z.string().optional(),
});