"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTaskSchema,
  updateTaskStatusSchema,
} from "@/lib/validations/task";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function createTaskAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    task_type: formData.get("task_type") || "general",
    related_lead_id: formData.get("related_lead_id") || undefined,
    related_customer_id: formData.get("related_customer_id") || undefined,
    assigned_to: formData.get("assigned_to"),
    priority: formData.get("priority") || "medium",
    status: formData.get("status") || "pending",
    due_date: formData.get("due_date") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid task data",
    };
  }

  const values = parsed.data;

  const taskPayload = {
    title: values.title,
    description: values.description || null,
    task_type: values.task_type,
    related_lead_id: values.related_lead_id || null,
    related_customer_id: values.related_customer_id || null,
    assigned_to: values.assigned_to,
    assigned_by: user.id,
    priority: values.priority,
    status: values.status,
    due_date: values.due_date
      ? new Date(values.due_date).toISOString()
      : null,
  };

  const taskResult = await (supabase as any)
    .from("tasks")
    .insert(taskPayload)
    .select("id, assigned_to, title")
    .single();

  const task = taskResult.data as
    | { id: string; assigned_to: string; title: string }
    | null;

  if (taskResult.error || !task) {
    return {
      error: String(taskResult.error?.message || "Failed to create task"),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "task",
    entity_id: task.id,
    action: "created",
    description: `Created task: ${task.title}`,
  });

  await (supabase as any).from("notifications").insert({
    user_id: task.assigned_to,
    type: "task",
    title: "New task assigned",
    message: `You have been assigned a new task: ${task.title}`,
    related_table: "tasks",
    related_id: task.id,
  });

  revalidatePath("/tasks");
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskStatusAction(
  taskId: string,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateTaskStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Invalid task status" };
  }

  const nextStatus = parsed.data.status;

  const updatePayload: {
    status: "pending" | "in_progress" | "completed" | "cancelled";
    completed_at: string | null;
  } = {
    status: nextStatus,
    completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
  };

  const updateResult = await (supabase as any)
    .from("tasks")
    .update(updatePayload)
    .eq("id", taskId);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "task",
    entity_id: taskId,
    action: "status_updated",
    description: `Updated task status to ${nextStatus}`,
  });

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");

  return { success: true };
}