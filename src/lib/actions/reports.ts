"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDailyReportSchema } from "@/lib/validations/report";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function createDailyReportAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createDailyReportSchema.safeParse({
    report_date: formData.get("report_date"),
    summary: formData.get("summary"),
    tasks_completed_count: formData.get("tasks_completed_count") || 0,
    leads_contacted_count: formData.get("leads_contacted_count") || 0,
    customers_supported_count: formData.get("customers_supported_count") || 0,
    blockers: formData.get("blockers") || undefined,
    next_day_plan: formData.get("next_day_plan") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid report data",
    };
  }

  const values = parsed.data;

  const reportResult = await (supabase as any)
    .from("daily_reports")
    .insert({
      staff_id: user.id,
      report_date: values.report_date,
      summary: values.summary,
      tasks_completed_count: values.tasks_completed_count,
      leads_contacted_count: values.leads_contacted_count,
      customers_supported_count: values.customers_supported_count,
      blockers: values.blockers || null,
      next_day_plan: values.next_day_plan || null,
    })
    .select("id")
    .single();

  const report = reportResult.data as { id: string } | null;

  if (reportResult.error) {
    const message = String(reportResult.error.message || reportResult.error);

    if (message.toLowerCase().includes("duplicate")) {
      return { error: "You already submitted a report for this date." };
    }

    return { error: message };
  }

  if (!report) {
    return { error: "Failed to create report" };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "report",
    entity_id: report.id,
    action: "created",
    description: `Submitted daily report for ${values.report_date}`,
  });

  revalidatePath("/reports");
  redirect(`/reports/${report.id}`);
}