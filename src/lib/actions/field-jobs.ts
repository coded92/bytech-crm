"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createFieldJobSchema,
  createFieldJobUpdateSchema,
  updateFieldJobSchema,
} from "@/lib/validations/field-jobs";

type CreatedFieldJobRow = {
  id: string;
  title: string;
  assigned_engineer_id: string | null;
};

export async function createFieldJobAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createFieldJobSchema.safeParse({
    customer_id: formData.get("customer_id"),
    branch_id: formData.get("branch_id") || undefined,
    asset_id: formData.get("asset_id") || undefined,
    support_ticket_id: formData.get("support_ticket_id") || undefined,
    title: formData.get("title"),
    job_type: formData.get("job_type"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    assigned_engineer_id: formData.get("assigned_engineer_id") || undefined,
    scheduled_date: formData.get("scheduled_date") || undefined,
    reported_issue: formData.get("reported_issue") || undefined,
    work_done: formData.get("work_done") || undefined,
    materials_used: formData.get("materials_used") || undefined,
    recommendation: formData.get("recommendation") || undefined,
    customer_feedback: formData.get("customer_feedback") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid field job data" };
  }

  const values = parsed.data;

  const { data, error } = await (supabase as any)
    .from("field_jobs")
    .insert({
      customer_id: values.customer_id,
      branch_id: values.branch_id || null,
      asset_id: values.asset_id || null,
      support_ticket_id: values.support_ticket_id || null,
      title: values.title,
      job_type: values.job_type,
      priority: values.priority,
      status: values.status,
      assigned_engineer_id: values.assigned_engineer_id || null,
      scheduled_date: values.scheduled_date || null,
      reported_issue: values.reported_issue || null,
      work_done: values.work_done || null,
      materials_used: values.materials_used || null,
      recommendation: values.recommendation || null,
      customer_feedback: values.customer_feedback || null,
      created_by: user.id,
    })
    .select("id, title, assigned_engineer_id")
    .single();

  const job = data as CreatedFieldJobRow | null;

  if (error || !job) {
    return { error: error?.message ?? "Failed to create field job" };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: job.id,
    action: "created",
    description: `Created field job: ${job.title}`,
  });

  if (job.assigned_engineer_id) {
    await (supabase as any).from("notifications").insert({
      user_id: job.assigned_engineer_id,
      type: "system",
      title: "New field job assigned",
      message: `A field job has been assigned to you: ${job.title}`,
      related_table: "field_jobs",
      related_id: job.id,
    });
  }

  revalidatePath("/field-jobs");
  redirect(`/field-jobs/${job.id}`);
}

export async function updateFieldJobAction(
  fieldJobId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateFieldJobSchema.safeParse({
    customer_id: formData.get("customer_id"),
    branch_id: formData.get("branch_id") || undefined,
    asset_id: formData.get("asset_id") || undefined,
    support_ticket_id: formData.get("support_ticket_id") || undefined,
    title: formData.get("title"),
    job_type: formData.get("job_type"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    assigned_engineer_id: formData.get("assigned_engineer_id") || undefined,
    scheduled_date: formData.get("scheduled_date") || undefined,
    reported_issue: formData.get("reported_issue") || undefined,
    work_done: formData.get("work_done") || undefined,
    materials_used: formData.get("materials_used") || undefined,
    recommendation: formData.get("recommendation") || undefined,
    customer_feedback: formData.get("customer_feedback") || undefined,
    started_at: formData.get("started_at") || undefined,
    completed_at: formData.get("completed_at") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid field job data" };
  }

  const values = parsed.data;

  const { error } = await (supabase as any)
    .from("field_jobs")
    .update({
      customer_id: values.customer_id,
      branch_id: values.branch_id || null,
      asset_id: values.asset_id || null,
      support_ticket_id: values.support_ticket_id || null,
      title: values.title,
      job_type: values.job_type,
      priority: values.priority,
      status: values.status,
      assigned_engineer_id: values.assigned_engineer_id || null,
      scheduled_date: values.scheduled_date || null,
      reported_issue: values.reported_issue || null,
      work_done: values.work_done || null,
      materials_used: values.materials_used || null,
      recommendation: values.recommendation || null,
      customer_feedback: values.customer_feedback || null,
      started_at: values.started_at || null,
      completed_at: values.completed_at || null,
    })
    .eq("id", fieldJobId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: fieldJobId,
    action: "updated",
    description: "Updated field job",
  });

  revalidatePath("/field-jobs");
  revalidatePath(`/field-jobs/${fieldJobId}`);

  return { success: true };
}

export async function createFieldJobUpdateAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createFieldJobUpdateSchema.safeParse({
    field_job_id: formData.get("field_job_id"),
    note: formData.get("note"),
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid update note" };
  }

  const values = parsed.data;

  const { error: updateError } = await (supabase as any)
    .from("field_job_updates")
    .insert({
      field_job_id: values.field_job_id,
      note: values.note,
      status: values.status || null,
      created_by: user.id,
    });

  if (updateError) {
    return { error: updateError.message };
  }

  if (values.status) {
    await (supabase as any)
      .from("field_jobs")
      .update({
        status: values.status,
        started_at:
          values.status === "in_progress" ? new Date().toISOString() : undefined,
        completed_at:
          values.status === "completed" ? new Date().toISOString() : undefined,
      })
      .eq("id", values.field_job_id);
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: values.field_job_id,
    action: "update_note_created",
    description: `Added field job update: ${values.note}`,
  });

  revalidatePath(`/field-jobs/${values.field_job_id}`);
  return { success: true };
}