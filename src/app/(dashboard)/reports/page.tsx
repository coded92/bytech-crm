import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireModule } from "@/lib/auth/require-module";
import { requireProfile } from "@/lib/auth/require-profile";
import {
  getCurrentUserPreferences,
  getUserItemsPerPage,
} from "@/lib/preferences/user-preferences";
import { ReportTable } from "@/components/reports/report-table";
import { Button } from "@/components/ui/button";

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

export default async function ReportsPage() {
  await requireModule("reports");

  const profile = (await requireProfile()) as ProfileWithDepartment;
  const preferences = await getCurrentUserPreferences(profile.id);
  const itemsPerPage = getUserItemsPerPage(preferences);
  const supabase = await createClient();

  let query = supabase
    .from("daily_reports")
    .select(`
      id,
      report_date,
      summary,
      tasks_completed_count,
      leads_contacted_count,
      customers_supported_count,
      submitted_at,
      staff:profiles!daily_reports_staff_id_fkey(
        id,
        full_name,
        department
      )
    `)
    .order("report_date", { ascending: false })
    .order("submitted_at", { ascending: false });

  if (profile.role !== "admin" && profile.department) {
    query = query.eq("staff.department", profile.department);
  }

  if (profile.role !== "admin" && !profile.department) {
    query = query.eq("staff_id", profile.id);
  }

  const { data: reports, error } = await query.limit(itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Reports
          </h2>

          <p className="text-slate-600">
            {profile.role === "admin"
              ? "Review daily submissions from all departments."
              : profile.department
                ? `Viewing ${profile.department.replaceAll("_", " ")} department reports.`
                : "Viewing your submitted reports."}
          </p>
        </div>

        <Button asChild>
          <Link href="/reports/new">Submit Report</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load reports: {error.message}
        </div>
      ) : (
        <ReportTable reports={reports || []} preferences={preferences} />
      )}
    </div>
  );
}
