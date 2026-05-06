import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectTaskForm } from "@/components/projects/project-task-form";
import { ProjectTimelineForm } from "@/components/projects/project-timeline-form";
import { ProjectTaskStatusForm } from "@/components/projects/project-task-status-form";
import { ProjectDocumentForm } from "@/components/projects/project-document-form";
import { ProjectDocumentList } from "@/components/projects/project-document-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectMemberForm } from "@/components/projects/project-member-form";
import { ProjectMemberList } from "@/components/projects/project-member-list";
import { ProjectTemplateForm } from "@/components/projects/project-template-form";

type ProjectDetailsPageProps = {
  params: Promise<{ id: string }>;
};

type ProjectRow = {
  id: string;
  project_code: string;
  project_name: string;
  customer_id: string | null;
  lead_id: string | null;
  quotation_id: string | null;
  invoice_id: string | null;
  receipt_id: string | null;
  project_type: string;
  description: string | null;
  project_manager_id: string | null;
  start_date: string | null;
  deadline: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "proposal"
    | "approved"
    | "paid"
    | "planning"
    | "in_progress"
    | "review"
    | "completed"
    | "maintenance"
    | "on_hold"
    | "cancelled";
  quotation_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  payment_status: "unpaid" | "part_payment" | "paid_in_full";
  invoice_number: string | null;
  receipt_number: string | null;
  recurring_revenue: boolean;
  annual_renewal_amount: number;
  next_renewal_date: string | null;
  project_cost_estimate: number;
  profit_estimate: number;
  progress: number;
  created_at: string;
  updated_at: string;
  customer?: {
    company_name: string | null;
  } | null;
  lead?: {
    company_name: string | null;
  } | null;
  quotation?: {
    quote_number: string | null;
  } | null;
  invoice?: {
    invoice_number: string | null;
  } | null;
  project_manager?: {
    full_name: string | null;
  } | null;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};

type ProjectTaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status:
    | "todo"
    | "in_progress"
    | "review"
    | "completed"
    | "blocked"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_profile?: {
    full_name: string | null;
  } | null;
};

type TimelineRow = {
  id: string;
  timeline_type: string;
  title: string;
  note: string | null;
  created_at: string;
  created_by_profile?: {
    full_name: string | null;
  } | null;
};

type ProjectDocumentRow = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

type ProjectMemberRow = {
  id: string;
  role: string | null;
  staff: {
    full_name: string | null;
  } | null;
};

type ProjectTemplateRow = {
  id: string;
  name: string;
};

type StaffUser = {
  id: string;
  full_name: string;
};

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: projectData, error: projectError },
    { data: tasksData },
    { data: timelineData },
    { data: documentsData },
    { data: membersData },
    { data: staffUsersData },
    { data: templatesData },
    ] = await Promise.all([
    supabase
      .from("projects")
      .select(`
        *,
        customer:customers(company_name),
        lead:leads(company_name),
        quotation:quotations(quote_number),
        invoice:payment_invoices(invoice_number),
        project_manager:profiles!projects_project_manager_id_fkey(full_name),
        created_by_profile:profiles!projects_created_by_fkey(full_name)
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("project_tasks")
      .select(`
        id,
        title,
        description,
        assigned_to,
        status,
        priority,
        due_date,
        completed_at,
        created_at,
        assigned_profile:profiles!project_tasks_assigned_to_fkey(full_name)
      `)
      .eq("project_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("project_timeline")
      .select(`
        id,
        timeline_type,
        title,
        note,
        created_at,
        created_by_profile:profiles!project_timeline_created_by_fkey(full_name)
      `)
      .eq("project_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("file_attachments")
      .select(`
        id,
        file_name,
        mime_type,
        file_size,
        created_at
      `)
      .eq("related_table", "projects")
      .eq("related_id", id)
      .order("created_at", { ascending: false }),

    supabase
        .from("project_members")
        .select(`
            id,
            role,
            staff:profiles!project_members_staff_id_fkey(full_name)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false }),

    supabase
      .from("project_templates")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
  ]);

  if (projectError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load project: {projectError.message}
      </div>
    );
  }

  if (!projectData) notFound();

  const project = projectData as ProjectRow;
  const tasks = (tasksData ?? []) as ProjectTaskRow[];
  const timeline = (timelineData ?? []) as TimelineRow[];
  const documents = (documentsData ?? []) as ProjectDocumentRow[];
  const members = (membersData ?? []) as ProjectMemberRow[];
  const staffUsers = (staffUsersData ?? []) as StaffUser[];
  const templates = (templatesData ?? []) as ProjectTemplateRow[];
  

  const margin =
    project.quotation_amount > 0
      ? (project.profit_estimate / project.quotation_amount) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {project.project_name}
          </h2>
          <p className="text-slate-600">{project.project_code}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ProjectStatusBadge status={project.status} />

          <Button asChild variant="outline">
            <Link href={`/projects/${project.id}/edit`}>Edit Project</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Project Code" value={project.project_code} />
              <InfoItem label="Project Name" value={project.project_name} />
              <InfoItem label="Client" value={project.customer?.company_name} />
              <InfoItem label="Lead" value={project.lead?.company_name} />
              <InfoItem
                label="Project Type"
                value={project.project_type.replaceAll("_", " ")}
              />
              <InfoItem
                label="Project Manager"
                value={project.project_manager?.full_name}
              />
              <InfoItem label="Priority" value={project.priority} />
              <InfoItem
                label="Status"
                value={project.status.replaceAll("_", " ")}
              />
              <InfoItem label="Start Date" value={formatDate(project.start_date)} />
              <InfoItem label="Deadline" value={formatDate(project.deadline)} />
              <InfoItem label="Progress" value={`${project.progress}%`} />
              <InfoItem
                label="Created By"
                value={project.created_by_profile?.full_name}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {project.description || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-sm text-slate-500">No tasks yet.</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {task.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {task.description || "-"}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Assigned to: {task.assigned_profile?.full_name || "-"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Due: {formatDateTime(task.due_date)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Badge variant="outline" className="capitalize">
                          {task.priority}
                        </Badge>

                        <Badge variant="outline" className="capitalize">
                          {task.status.replaceAll("_", " ")}
                        </Badge>

                        <ProjectTaskStatusForm
                          taskId={task.id}
                          projectId={project.id}
                          currentStatus={task.status}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="border-t border-slate-200 pt-6">
                <ProjectTaskForm
                  projectId={project.id}
                  staffUsers={staffUsers}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Timeline</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No timeline updates yet.
                </div>
              ) : (
                timeline.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {item.timeline_type.replaceAll("_", " ")} ·{" "}
                          {item.created_by_profile?.full_name || "Unknown user"}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {item.note || "-"}
                    </p>
                  </div>
                ))
              )}

              <div className="border-t border-slate-200 pt-6">
                <ProjectTimelineForm projectId={project.id} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <ProjectDocumentList
                projectId={project.id}
                documents={documents}
              />

              <div className="border-t border-slate-200 pt-6">
                <ProjectDocumentForm projectId={project.id} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Template</CardTitle>
                </CardHeader>

                <CardContent>
                    <ProjectTemplateForm projectId={project.id} templates={templates} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Project Team</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                <ProjectMemberList members={members} />

                <div className="border-t border-slate-200 pt-6">
                    <ProjectMemberForm projectId={project.id} staffUsers={staffUsers} />
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                <SummaryItem
                    label="Quotation Amount"
                    value={formatCurrency(project.quotation_amount)}
                />
                <SummaryItem
                    label="Amount Paid"
                    value={formatCurrency(project.amount_paid)}
                />
                <SummaryItem
                    label="Outstanding"
                    value={formatCurrency(project.outstanding_balance)}
                />
                <SummaryItem
                    label="Payment Status"
                    value={project.payment_status.replaceAll("_", " ")}
                />
                <SummaryItem
                    label="Cost Estimate"
                    value={formatCurrency(project.project_cost_estimate)}
                />
                <SummaryItem
                    label="Profit Estimate"
                    value={formatCurrency(project.profit_estimate)}
                />
                <SummaryItem label="Margin" value={`${margin.toFixed(1)}%`} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm capitalize text-slate-900">{value ?? "-"}</p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right capitalize text-slate-900">{value}</span>
    </div>
  );
}