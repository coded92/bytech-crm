import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "staff"]),
  job_title: z.string().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "staff"]),
  job_title: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.enum(["true", "false"]),
});