import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportDetailsPageProps = {
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

type ReportRow = {
  id: string;
  staff_id: string;
  report_date: string;
  summary: string;
  blockers: string | null;
  next_day_plan: string | null;
  submitted_at: string;
  tasks_completed_count: number;
  leads_contacted_count: number;
  customers_supported_count: number;
  staff?: {
    full_name: string | null;
    email: string | null;
    department: Department | null;
  } | null;
};

export default async function ReportDetailsPage({
  params,
}: ReportDetailsPageProps) {
  const profile = (await requireProfile()) as ProfileWithDepartment;
  const { id } = await params;
  const supabase = await createClient();

  const { data: reportData } = await supabase
    .from("daily_reports")
    .select(`
      *,
      staff:profiles!daily_reports_staff_id_fkey(
        full_name,
        email,
        department
      )
    `)
    .eq("id", id)
    .single();

  const report = reportData as ReportRow | null;

  if (!report) {
    notFound();
  }

  if (
    profile.role !== "admin" &&
    profile.department &&
    report.staff?.department !== profile.department
  ) {
    notFound();
  }

  if (
    profile.role !== "admin" &&
    !profile.department &&
    profile.id !== report.staff_id
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Daily Report
        </h2>
        <p className="text-slate-600">
          {report.staff?.full_name ?? "Unknown staff"} ·{" "}
          {formatDate(report.report_date)}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Summary of Work Done</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blockers / Challenges</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {report.blockers || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next Day Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {report.next_day_plan || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <InfoItem label="Staff" value={report.staff?.full_name ?? "-"} />
              <InfoItem label="Email" value={report.staff?.email ?? "-"} />
              <InfoItem
                label="Department"
                value={report.staff?.department?.replaceAll("_", " ") ?? "-"}
              />
              <InfoItem
                label="Report Date"
                value={formatDate(report.report_date)}
              />
              <InfoItem
                label="Submitted At"
                value={formatDateTime(report.submitted_at)}
              />
              <InfoItem
                label="Tasks Completed"
                value={String(report.tasks_completed_count)}
              />
              <InfoItem
                label="Leads Contacted"
                value={String(report.leads_contacted_count)}
              />
              <InfoItem
                label="Customers Supported"
                value={String(report.customers_supported_count)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value}</p>
    </div>
  );
}