import { z } from "zod";

export const createDailyReportSchema = z.object({
  report_date: z.string().min(1, "Report date is required"),
  summary: z.string().min(10, "Summary is required"),
  tasks_completed_count: z.coerce.number().min(0),
  leads_contacted_count: z.coerce.number().min(0),
  customers_supported_count: z.coerce.number().min(0),
  blockers: z.string().optional(),
  next_day_plan: z.string().optional(),
});