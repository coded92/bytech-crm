"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function refreshDashboardAction() {
  const supabase = await createClient();

  await supabase.rpc("mark_overdue_invoices");

  revalidatePath("/dashboard");
}