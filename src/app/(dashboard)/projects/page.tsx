import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      id,
      project_code,
      project_name,
      project_type,
      status,
      priority,
      deadline,
      progress,
      quotation_amount,
      amount_paid,
      outstanding_balance,
      customer:customers(company_name),
      project_manager:profiles!projects_project_manager_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Projects
          </h2>
          <p className="text-slate-600">
            Manage client projects, tasks, payments, timelines, and delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button asChild variant="outline">
            <Link href="/projects/analytics">Analytics</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/projects/renewals">Renewals</Link>
          </Button>

          <Button asChild>
            <Link href="/projects/new">Create Project</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load projects: {error.message}
        </div>
      ) : (
        <ProjectTable projects={projects || []} />
      )}
    </div>
  );
}