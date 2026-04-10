import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { FieldJobTable } from "@/components/field-jobs/field-job-table";
import { Button } from "@/components/ui/button";

type FieldJobRow = {
  id: string;
  job_number: string;
  title: string;
  job_type: string;
  priority: string;
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "cancelled";
  scheduled_date: string | null;
  customer: {
    company_name: string | null;
  } | null;
  assigned_engineer: {
    full_name: string | null;
  } | null;
};

export default async function FieldJobsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("field_jobs")
    .select(`
      id,
      job_number,
      title,
      job_type,
      priority,
      status,
      scheduled_date,
      customer:customers(company_name),
      assigned_engineer:profiles!field_jobs_assigned_engineer_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (profile.role !== "admin") {
    query = query.eq("assigned_engineer_id", profile.id);
  }

  const { data, error } = await query;
  const jobs = (data ?? []) as FieldJobRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Field Jobs
          </h2>
          <p className="text-slate-600">
            Track engineer site visits, repairs, inspections, and installations.
          </p>
        </div>

        <Button asChild>
          <Link href="/field-jobs/new">Create Field Job</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load field jobs: {error.message}
        </div>
      ) : (
        <FieldJobTable jobs={jobs} />
      )}
    </div>
  );
}