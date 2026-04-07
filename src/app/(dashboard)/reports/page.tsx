import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { ReportTable } from "@/components/reports/report-table";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const query =
    profile.role === "admin"
      ? supabase
          .from("daily_reports")
          .select(`
            id,
            report_date,
            summary,
            tasks_completed_count,
            leads_contacted_count,
            customers_supported_count,
            submitted_at,
            staff:profiles!daily_reports_staff_id_fkey(full_name)
          `)
          .order("report_date", { ascending: false })
          .order("submitted_at", { ascending: false })
      : supabase
          .from("daily_reports")
          .select(`
            id,
            report_date,
            summary,
            tasks_completed_count,
            leads_contacted_count,
            customers_supported_count,
            submitted_at,
            staff:profiles!daily_reports_staff_id_fkey(full_name)
          `)
          .eq("staff_id", profile.id)
          .order("report_date", { ascending: false })
          .order("submitted_at", { ascending: false });

  const { data: reports, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Reports
          </h2>
          <p className="text-slate-600">
            {profile.role === "admin"
              ? "Review daily submissions from all staff."
              : "Track and review your submitted reports."}
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
        <ReportTable reports={reports || []} />
      )}
    </div>
  );
}