import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FieldJobEditForm } from "@/components/field-jobs/field-job-edit-form";

type EditFieldJobPageProps = {
  params: Promise<{ id: string }>;
};

type CustomerOption = {
  id: string;
  company_name: string;
};

type BranchOption = {
  id: string;
  branch_name: string;
};

type AssetOption = {
  id: string;
  asset_tag: string;
};

type SupportOption = {
  id: string;
  ticket_number: string;
};

type EngineerOption = {
  id: string;
  full_name: string;
};

type FieldJobRow = {
  id: string;
  customer_id: string;
  branch_id: string | null;
  asset_id: string | null;
  support_ticket_id: string | null;
  title: string;
  job_type:
    | "wiring_repair"
    | "hardware_repair"
    | "site_inspection"
    | "site_survey"
    | "site_assessment"
    | "installation"
    | "maintenance_visit"
    | "device_replacement"
    | "network_troubleshooting"
    | "training_visit"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "pending"
    | "assigned"
    | "in_progress"
    | "awaiting_parts"
    | "completed"
    | "cancelled";
  assigned_engineer_id: string | null;
  scheduled_date: string | null;
  reported_issue: string | null;
  work_done: string | null;
  materials_used: string | null;
  recommendation: string | null;
  customer_feedback: string | null;
};

export default async function EditFieldJobPage({
  params,
}: EditFieldJobPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: customersData }, { data: branchesData }, { data: assetsData }, { data: supportData }, { data: engineersData }] =
    await Promise.all([
      supabase
        .from("field_jobs")
        .select(`
          id,
          customer_id,
          branch_id,
          asset_id,
          support_ticket_id,
          title,
          job_type,
          priority,
          status,
          assigned_engineer_id,
          scheduled_date,
          reported_issue,
          work_done,
          materials_used,
          recommendation,
          customer_feedback
        `)
        .eq("id", id)
        .single(),

      supabase
        .from("customers")
        .select("id, company_name")
        .order("company_name", { ascending: true }),

      supabase
        .from("customer_branches")
        .select("id, branch_name")
        .order("branch_name", { ascending: true }),

      supabase
        .from("assets")
        .select("id, asset_tag")
        .order("asset_tag", { ascending: true }),

      supabase
        .from("support_tickets")
        .select("id, ticket_number")
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ]);

  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Field Job
        </h2>
        <p className="text-slate-600">
          Update assigned engineer, job details, and field report information.
        </p>
      </div>

      <FieldJobEditForm
        job={job as FieldJobRow}
        customers={(customersData ?? []) as CustomerOption[]}
        branches={(branchesData ?? []) as BranchOption[]}
        assets={(assetsData ?? []) as AssetOption[]}
        supportTickets={(supportData ?? []) as SupportOption[]}
        engineers={(engineersData ?? []) as EngineerOption[]}
      />
    </div>
  );
}