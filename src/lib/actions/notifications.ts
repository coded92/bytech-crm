"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const updateResult = await (supabase as any)
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function markAllNotificationsAsReadAction(): Promise<ActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const updateResult = await (supabase as any)
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (updateResult.error) {
    return {
      error: String(updateResult.error.message || updateResult.error),
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/dashboard");

  return { success: true };
}