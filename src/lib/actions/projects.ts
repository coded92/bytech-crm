"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  projectTaskSchema,
  projectTimelineSchema,
  updateProjectTaskStatusSchema,
} from "@/lib/validations/project";

type ActionResponse = { success: true } | { error: string };

function checkboxToBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function createProjectAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createProjectSchema.safeParse({
    project_name: formData.get("project_name"),
    customer_id: formData.get("customer_id") || undefined,
    lead_id: formData.get("lead_id") || undefined,
    quotation_id: formData.get("quotation_id") || undefined,
    invoice_id: formData.get("invoice_id") || undefined,
    receipt_id: formData.get("receipt_id") || undefined,
    project_type: formData.get("project_type"),
    description: formData.get("description") || undefined,
    project_manager_id: formData.get("project_manager_id") || undefined,
    start_date: formData.get("start_date") || undefined,
    deadline: formData.get("deadline") || undefined,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "planning",
    quotation_amount: formData.get("quotation_amount") || 0,
    amount_paid: formData.get("amount_paid") || 0,
    payment_status: formData.get("payment_status") || "unpaid",
    invoice_number: formData.get("invoice_number") || undefined,
    receipt_number: formData.get("receipt_number") || undefined,
    recurring_revenue: checkboxToBoolean(formData.get("recurring_revenue")),
    annual_renewal_amount: formData.get("annual_renewal_amount") || 0,
    next_renewal_date: formData.get("next_renewal_date") || undefined,
    project_cost_estimate: formData.get("project_cost_estimate") || 0,
    progress: formData.get("progress") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data" };
  }

  const values = parsed.data;

  const projectResult = await (supabase as any)
    .from("projects")
    .insert({
      project_name: values.project_name,
      customer_id: values.customer_id || null,
      lead_id: values.lead_id || null,
      quotation_id: values.quotation_id || null,
      invoice_id: values.invoice_id || null,
      receipt_id: values.receipt_id || null,
      project_type: values.project_type,
      description: values.description || null,
      project_manager_id: values.project_manager_id || null,
      start_date: values.start_date || null,
      deadline: values.deadline || null,
      priority: values.priority,
      status: values.status,
      quotation_amount: values.quotation_amount,
      amount_paid: values.amount_paid,
      payment_status: values.payment_status,
      invoice_number: values.invoice_number || null,
      receipt_number: values.receipt_number || null,
      recurring_revenue: values.recurring_revenue || false,
      annual_renewal_amount: values.annual_renewal_amount || 0,
      next_renewal_date: values.next_renewal_date || null,
      project_cost_estimate: values.project_cost_estimate || 0,
      progress: values.progress,
      created_by: user.id,
    })
    .select("id, project_name, project_manager_id")
    .single();

  const project = projectResult.data as
    | { id: string; project_name: string; project_manager_id: string | null }
    | null;

  if (projectResult.error || !project) {
    return {
      error: String(projectResult.error?.message || "Failed to create project"),
    };
  }

  const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);

  if (memberIds.length > 0) {
    const membersPayload = memberIds.map((staffId) => ({
      project_id: project.id,
      staff_id: staffId,
      role: null,
    }));

    await (supabase as any).from("project_members").insert(membersPayload);
  }

  await (supabase as any).from("project_timeline").insert({
    project_id: project.id,
    timeline_type: "created",
    title: "Project created",
    note: `Project created by team member.`,
    created_by: user.id,
  });

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project",
    entity_id: project.id,
    action: "created",
    description: `Created project: ${project.project_name}`,
  });

  if (project.project_manager_id) {
    await (supabase as any).from("notifications").insert({
      user_id: project.project_manager_id,
      type: "system",
      title: "New project assigned",
      message: `You have been assigned as project manager for ${project.project_name}`,
      related_table: "projects",
      related_id: project.id,
    });
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createProjectSchema.safeParse({
    project_name: formData.get("project_name"),
    customer_id: formData.get("customer_id") || undefined,
    lead_id: formData.get("lead_id") || undefined,
    quotation_id: formData.get("quotation_id") || undefined,
    invoice_id: formData.get("invoice_id") || undefined,
    receipt_id: formData.get("receipt_id") || undefined,
    project_type: formData.get("project_type"),
    description: formData.get("description") || undefined,
    project_manager_id: formData.get("project_manager_id") || undefined,
    start_date: formData.get("start_date") || undefined,
    deadline: formData.get("deadline") || undefined,
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "planning",
    quotation_amount: formData.get("quotation_amount") || 0,
    amount_paid: formData.get("amount_paid") || 0,
    payment_status: formData.get("payment_status") || "unpaid",
    invoice_number: formData.get("invoice_number") || undefined,
    receipt_number: formData.get("receipt_number") || undefined,
    recurring_revenue: checkboxToBoolean(formData.get("recurring_revenue")),
    annual_renewal_amount: formData.get("annual_renewal_amount") || 0,
    next_renewal_date: formData.get("next_renewal_date") || undefined,
    project_cost_estimate: formData.get("project_cost_estimate") || 0,
    progress: formData.get("progress") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data" };
  }

  const values = parsed.data;

  const updateResult = await (supabase as any)
    .from("projects")
    .update({
      project_name: values.project_name,
      customer_id: values.customer_id || null,
      lead_id: values.lead_id || null,
      quotation_id: values.quotation_id || null,
      invoice_id: values.invoice_id || null,
      receipt_id: values.receipt_id || null,
      project_type: values.project_type,
      description: values.description || null,
      project_manager_id: values.project_manager_id || null,
      start_date: values.start_date || null,
      deadline: values.deadline || null,
      priority: values.priority,
      status: values.status,
      quotation_amount: values.quotation_amount,
      amount_paid: values.amount_paid,
      payment_status: values.payment_status,
      invoice_number: values.invoice_number || null,
      receipt_number: values.receipt_number || null,
      recurring_revenue: values.recurring_revenue || false,
      annual_renewal_amount: values.annual_renewal_amount || 0,
      next_renewal_date: values.next_renewal_date || null,
      project_cost_estimate: values.project_cost_estimate || 0,
      progress: values.progress,
    })
    .eq("id", projectId);

  if (updateResult.error) {
    return { error: String(updateResult.error.message || updateResult.error) };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project",
    entity_id: projectId,
    action: "updated",
    description: `Updated project: ${values.project_name}`,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/edit`);

  redirect(`/projects/${projectId}`);
}

export async function createProjectTaskAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = projectTaskSchema.safeParse({
    project_id: formData.get("project_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assigned_to: formData.get("assigned_to") || undefined,
    status: formData.get("status") || "todo",
    priority: formData.get("priority") || "medium",
    due_date: formData.get("due_date") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task data" };
  }

  const values = parsed.data;

  const taskResult = await (supabase as any)
    .from("project_tasks")
    .insert({
      project_id: values.project_id,
      title: values.title,
      description: values.description || null,
      assigned_to: values.assigned_to || null,
      status: values.status,
      priority: values.priority,
      due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
      created_by: user.id,
    })
    .select("id, title, assigned_to")
    .single();

  const task = taskResult.data as
    | { id: string; title: string; assigned_to: string | null }
    | null;

  if (taskResult.error || !task) {
    return { error: String(taskResult.error?.message || "Failed to create task") };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project_task",
    entity_id: task.id,
    action: "created",
    description: `Created project task: ${task.title}`,
  });

  if (task.assigned_to) {
    await (supabase as any).from("notifications").insert({
      user_id: task.assigned_to,
      type: "task",
      title: "New project task assigned",
      message: `You have been assigned a project task: ${task.title}`,
      related_table: "project_tasks",
      related_id: task.id,
    });
  }

  revalidatePath(`/projects/${values.project_id}`);
  revalidatePath("/projects");

  return { success: true };
}

export async function updateProjectTaskStatusAction(
  taskId: string,
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = updateProjectTaskStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Invalid task status" };

  const nextStatus = parsed.data.status;

  const updateResult = await (supabase as any)
    .from("project_tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId);

  if (updateResult.error) {
    return { error: String(updateResult.error.message || updateResult.error) };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project_task",
    entity_id: taskId,
    action: "status_updated",
    description: `Updated project task status to ${nextStatus}`,
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true };
}

export async function createProjectTimelineAction(
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = projectTimelineSchema.safeParse({
    project_id: formData.get("project_id"),
    timeline_type: formData.get("timeline_type") || "note",
    title: formData.get("title"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid timeline data" };
  }

  const values = parsed.data;

  const result = await (supabase as any).from("project_timeline").insert({
    project_id: values.project_id,
    timeline_type: values.timeline_type,
    title: values.title,
    note: values.note || null,
    created_by: user.id,
  });

  if (result.error) {
    return { error: String(result.error.message || result.error) };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project",
    entity_id: values.project_id,
    action: "timeline_added",
    description: `Added project timeline note: ${values.title}`,
  });

  revalidatePath(`/projects/${values.project_id}`);

  return { success: true };
}

export async function addProjectMemberAction(
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const staffId = String(formData.get("user_id") || "").trim();
  const role = String(formData.get("role") || "").trim();

  if (!staffId) {
    return { error: "Staff member is required" };
  }

  const { error } = await (supabase as any)
    .from("project_members")
    .insert({
      project_id: projectId,
      staff_id: staffId,
      role: role || null,
      added_by: user.id,
    });

  if (error) {
    return {
      error: String(error.message || "Failed to add member"),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "project_member",
    entity_id: projectId,
    action: "added",
    description: "Added project team member",
  });

  await (supabase as any).from("notifications").insert({
    user_id: staffId,
    type: "system",
    title: "Added to project",
    message: "You have been added to a project team",
    related_table: "projects",
    related_id: projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");

  return { success: true };
}

export async function applyProjectTemplateAction(
  projectId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const templateId = String(formData.get("template_id") || "").trim();

  if (!templateId) {
    return { error: "Please select a template" };
  }

  const { data: templateData, error: templateError } = await (supabase as any)
    .from("project_templates")
    .select("id, name, default_tasks")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (templateError || !templateData) {
    return { error: templateError?.message ?? "Template not found" };
  }

  const template = templateData as {
    id: string;
    name: string;
    default_tasks: unknown;
  };

  const rawTasks = Array.isArray(template.default_tasks)
    ? template.default_tasks
    : [];

  const tasks = rawTasks
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: item,
          description: null,
          priority: "medium",
          status: "todo",
        };
      }

      if (item && typeof item === "object") {
        const task = item as {
          title?: string;
          name?: string;
          description?: string;
          priority?: "low" | "medium" | "high" | "urgent";
        };

        return {
          title: task.title || task.name || "",
          description: task.description || null,
          priority: task.priority || "medium",
          status: "todo",
        };
      }

      return null;
    })
    .filter(
      (
        task
      ): task is {
        title: string;
        description: string | null;
        priority: "low" | "medium" | "high" | "urgent";
        status: "todo";
      } => Boolean(task?.title)
    );

  if (tasks.length === 0) {
    return { error: "This template has no tasks" };
  }

  const payload = tasks.map((task) => ({
    project_id: projectId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    created_by: user.id,
  }));

  const { error } = await (supabase as any)
    .from("project_tasks")
    .insert(payload);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("project_timeline").insert({
    project_id: projectId,
    timeline_type: "template_applied",
    title: "Template applied",
    note: `Applied template: ${template.name}`,
    created_by: user.id,
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true };
}