import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { DailyReportEditForm } from "@/components/reports/daily-report-edit-form";

type EditDailyReportPageProps = {
  params: Promise<{ id: string }>;
};

type Department =
  | "sales"
  | "operations"
  | "support"
  | "engineering"
  | "inventory"
  | "finance"
  | "hr";

type ProfileWithDepartment = {
  id: string;
  role: "admin" | "staff";
  department: Department | null;
};

type DailyReportRow = {
  id: string;
  staff_id: string;
  report_date: string;
  summary: string;
  tasks_completed_count: number;
  leads_contacted_count: number;
  customers_supported_count: number;
  blockers: string | null;
  next_day_plan: string | null;
  submitted_at: string;
  created_at: string;
  staff?: {
    department: Department | null;
  } | null;
};

export default async function EditDailyReportPage({
  params,
}: EditDailyReportPageProps) {
  const profile = (await requireProfile()) as ProfileWithDepartment;
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("daily_reports")
    .select(`
      id,
      staff_id,
      report_date,
      summary,
      tasks_completed_count,
      leads_contacted_count,
      customers_supported_count,
      blockers,
      next_day_plan,
      submitted_at,
      created_at,
      staff:profiles!daily_reports_staff_id_fkey(department)
    `)
    .eq("id", id)
    .single();

  if (!report) {
    notFound();
  }

  const typedReport = report as DailyReportRow;

  if (
    profile.role !== "admin" &&
    profile.department &&
    typedReport.staff?.department !== profile.department
  ) {
    notFound();
  }

  if (
    profile.role !== "admin" &&
    !profile.department &&
    profile.id !== typedReport.staff_id
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Daily Report
        </h2>
        <p className="text-slate-600">
          Update submitted work summary, blockers, and next day plan.
        </p>
      </div>

      <DailyReportEditForm report={typedReport} />
    </div>
  );
}