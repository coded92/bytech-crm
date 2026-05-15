import { z } from "zod";

const availableModules = [
  "dashboard",
  "leads",
  "customers",
  "quotations",
  "invoices",
  "payments",
  "tasks",
  "projects",
  "reports",
  "support",
  "notifications",
  "deployments",
  "assets",
  "field_jobs",
  "engineer_daily",
  "inventory",
  "suppliers",
  "supplier_payables",
  "restocking",
  "expenses",
  "audit_logs",
  "users",
  "settings",
  "search",
  "messages",
] as const;

const departments = [
  "sales",
  "operations",
  "support",
  "engineering",
  "inventory",
  "finance",
  "hr",
] as const;

export const createUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "staff"]),
  department: z.enum(departments),

  job_title: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  hire_date: z.string().optional(),
  birthday: z.string().optional(),
  employee_number: z.string().optional(),
  force_password_change: z.boolean().default(false),
  allowed_modules: z.array(z.enum(availableModules)).default([]),
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "staff"]),
  department: z.enum(departments),

  job_title: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  hire_date: z.string().optional(),
  birthday: z.string().optional(),
  employee_number: z.string().optional(),
  force_password_change: z.boolean().default(false),
  allowed_modules: z.array(z.enum(availableModules)).default([]),
  is_active: z.enum(["true", "false"]),
});
