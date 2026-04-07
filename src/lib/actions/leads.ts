"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  leadFormSchema,
  leadNoteSchema,
  leadStatusSchema,
} from "@/lib/validations/lead";

export async function createLeadAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const parsed = leadFormSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_person: formData.get("contact_person"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    business_type: formData.get("business_type"),
    industry: formData.get("industry"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    source_id: formData.get("source_id") || undefined,
    assigned_to: formData.get("assigned_to") || undefined,
    status: formData.get("status") || "new",
    estimated_value: formData.get("estimated_value") || 0,
    interested_plan: formData.get("interested_plan") || "unknown",
    next_follow_up_at: formData.get("next_follow_up_at") || undefined,
    lost_reason: formData.get("lost_reason") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid form data");
  }

  const values = parsed.data;

  const payload = {
    company_name: values.company_name,
    contact_person: values.contact_person,
    phone: values.phone || null,
    email: values.email || null,
    business_type: values.business_type || null,
    industry: values.industry || null,
    address: values.address || null,
    city: values.city || null,
    state: values.state || null,
    source_id: values.source_id || null,
    assigned_to: values.assigned_to || user.id,
    status: values.status,
    estimated_value: values.estimated_value,
    interested_plan: values.interested_plan,
    next_follow_up_at: values.next_follow_up_at
      ? new Date(values.next_follow_up_at).toISOString()
      : null,
    lost_reason: values.lost_reason || null,
    created_by: user.id,
  } as never;

 const leadResult = await supabase
  .from("leads")
  .insert(payload)
  .select("id")
  .single();

const lead = leadResult.data as { id: string } | null;
const error = leadResult.error;

  if (error || !lead) {
    throw new Error(error?.message ?? "Failed to create lead");
  }

  await supabase.from("lead_activities").insert({
    lead_id: lead.id,
    activity_type: "created",
    actor_id: user.id,
    new_value: {
      status: values.status,
    },
  } as never);

  await supabase.from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "lead",
    entity_id: lead.id,
    action: "created",
    description: `Created lead for ${values.company_name}`,
  } as never);

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function addLeadNoteAction(leadId: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = leadNoteSchema.safeParse({
    note: formData.get("note"),
    note_type: formData.get("note_type") || "general",
    follow_up_date: formData.get("follow_up_date") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid note data",
    };
  }

  const values = parsed.data;

  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    note: values.note,
    note_type: values.note_type,
    follow_up_date: values.follow_up_date
      ? new Date(values.follow_up_date).toISOString()
      : null,
    created_by: user.id,
  } as never);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "note_added",
    actor_id: user.id,
    new_value: {
      note_type: values.note_type,
      follow_up_date: values.follow_up_date || null,
    },
  } as never);

  await supabase
    .from("leads")
    .update({
      next_follow_up_at: values.follow_up_date
        ? new Date(values.follow_up_date).toISOString()
        : null,
    } as never)
    .eq("id", leadId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");

  return { success: true };
}

export async function updateLeadStatusAction(
  leadId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = leadStatusSchema.safeParse({
    status: formData.get("status"),
    lost_reason: formData.get("lost_reason") || undefined,
    next_follow_up_at: formData.get("next_follow_up_at") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid status update",
    };
  }

  const values = parsed.data;

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .single();

  if (existingLeadError) {
    return { error: existingLeadError.message };
  }

  await supabase
    .from("leads")
    .update({
      status: values.status,
      lost_reason: values.lost_reason || null,
      next_follow_up_at: values.next_follow_up_at
        ? new Date(values.next_follow_up_at).toISOString()
        : null,
      last_contacted_at: new Date().toISOString(),
    } as never)
    .eq("id", leadId);

  await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: "status_changed",
    actor_id: user.id,
    old_value: {
      status: (existingLead as { status?: string | null } | null)?.status ?? null,
    },
    new_value: {
      status: values.status,
      lost_reason: values.lost_reason || null,
    },
  } as never);

  await supabase.from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "lead",
    entity_id: leadId,
    action: "status_updated",
    description: `Updated lead status to ${values.status}`,
  } as never);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");

  return { success: true };
}