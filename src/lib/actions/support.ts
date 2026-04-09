"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createSupportTicketSchema,
  updateSupportTicketSchema,
} from "@/lib/validations/support";
import { requireAdmin } from "@/lib/auth/require-admin";

type CreatedTicketRow = {
  id: string;
  title: string;
  assigned_to: string | null;
};

export async function createSupportTicketAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = createSupportTicketSchema.safeParse({
    customer_id: formData.get("customer_id"),
    asset_id: formData.get("asset_id") || undefined,
    title: formData.get("title"),
    issue_type: formData.get("issue_type"),
    priority: formData.get("priority"),
    description: formData.get("description") || undefined,
    assigned_to: formData.get("assigned_to") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid ticket data" };
  }

  const values = parsed.data;

  const insertPayload = {
    customer_id: values.customer_id,
    asset_id: values.asset_id || null,
    title: values.title,
    issue_type: values.issue_type,
    priority: values.priority,
    description: values.description || null,
    assigned_to: values.assigned_to || null,
    created_by: user.id,
    status: "open" as const,
  };

  const supportTable = (supabase as any).from("support_tickets");

  const { data, error } = await supportTable
    .insert(insertPayload)
    .select("id, title, assigned_to")
    .single();

  const ticket = data as CreatedTicketRow | null;

  if (error || !ticket) {
    return { error: error?.message ?? "Failed to create support ticket" };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "support_ticket",
    entity_id: ticket.id,
    action: "created",
    description: `Created support ticket: ${ticket.title}`,
  });

  if (ticket.assigned_to) {
    await (supabase as any).from("notifications").insert({
      user_id: ticket.assigned_to,
      type: "system",
      title: "New support ticket assigned",
      message: `A support ticket has been assigned to you: ${ticket.title}`,
      related_table: "support_tickets",
      related_id: ticket.id,
    });
  }

  revalidatePath("/support");
  revalidatePath(`/customers/${values.customer_id}`);

  if (values.asset_id) {
    revalidatePath(`/assets/${values.asset_id}`);
  }

  redirect(`/support/${ticket.id}`);
}

export async function updateSupportTicketAction(
  ticketId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateSupportTicketSchema.safeParse({
    status: formData.get("status"),
    assigned_to: formData.get("assigned_to") || undefined,
    resolution_notes: formData.get("resolution_notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid update data" };
  }

  const values = parsed.data;

  const updatePayload: {
    status: "open" | "in_progress" | "resolved" | "closed";
    assigned_to: string | null;
    resolution_notes: string | null;
    resolved_at: string | null;
  } = {
    status: values.status,
    assigned_to: values.assigned_to || null,
    resolution_notes: values.resolution_notes || null,
    resolved_at:
      values.status === "resolved" || values.status === "closed"
        ? new Date().toISOString()
        : null,
  };

  const { error } = await (supabase as any)
    .from("support_tickets")
    .update(updatePayload)
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "support_ticket",
    entity_id: ticketId,
    action: "updated",
    description: `Updated support ticket status to ${values.status}`,
  });

  revalidatePath("/support");
  revalidatePath(`/support/${ticketId}`);

  return { success: true };
}

export async function deleteSupportTicketAction(ticketId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: admin.id,
    entity_type: "support_ticket",
    entity_id: ticketId,
    action: "deleted",
    description: "Deleted support ticket",
  });

  revalidatePath("/support");
  return { success: true };
}