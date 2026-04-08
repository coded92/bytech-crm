"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ProfileRoleRow = {
  role: "admin" | "staff";
};

type ReminderScanResult = {
  success?: boolean;
  created_count?: number;
};

export async function runReminderScanAction() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: profileError.message };
  }

  const profile = profileData as ProfileRoleRow | null;

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can run reminders." };
  }

  await supabase.rpc("mark_overdue_invoices");

  const { data, error } = await supabase.rpc("generate_system_reminders");

  if (error) {
    return { error: error.message };
  }

  const result = data as ReminderScanResult | null;

  await supabase.from("activity_logs").insert(
    {
      actor_id: user.id,
      entity_type: "system",
      entity_id: user.id,
      action: "reminder_scan_run",
      description: `Ran reminder scan and created ${result?.created_count ?? 0} reminders`,
    } as never
  );

  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/leads");
  revalidatePath("/tasks");
  revalidatePath("/payments/invoices");

  return {
    success: true,
    createdCount: result?.created_count ?? 0,
  };
}