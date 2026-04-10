import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldJobRow = {
  id: string;
  job_number: string;
  title: string;
  status: string;
  scheduled_date: string | null;
  completed_at: string | null;
  customer: {
    company_name: string | null;
  } | null;
};

export default async function FieldJobsDailyReportPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("field_jobs")
    .select(`
      id,
      job_number,
      title,
      status,
      scheduled_date,
      completed_at,
      customer:customers(company_name)
    `)
    .eq("scheduled_date", today)
    .order("created_at", { ascending: false });

  if (profile.role !== "admin") {
    query = query.eq("assigned_engineer_id", profile.id);
  }

  const { data } = await query;
  const jobs = (data ?? []) as FieldJobRow[];

  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const inProgressCount = jobs.filter((job) => job.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Engineer Daily Report
        </h2>
        <p className="text-slate-600">
          Overview of field jobs for {formatDate(today)}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total Jobs Today" value={String(jobs.length)} />
        <SummaryCard label="Completed" value={String(completedCount)} />
        <SummaryCard label="In Progress" value={String(inProgressCount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Jobs</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs scheduled today.</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="font-medium text-slate-900">
                  {job.title} ({job.job_number})
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {job.customer?.company_name || "-"} · {job.status}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Scheduled: {formatDate(job.scheduled_date)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Completed: {formatDateTime(job.completed_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-bold text-slate-900">
        {value}
      </CardContent>
    </Card>
  );
}