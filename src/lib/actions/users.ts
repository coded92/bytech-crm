"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUserSchema } from "@/lib/validations/user";

type ActionResponse =
  | { success: true }
  | { error: string };

export async function createUserAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const profileResult = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileResult.data as { role: string } | null;

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can create users." };
  }

  const parsed = createUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    job_title: formData.get("job_title") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid user data",
    };
  }

  const values = parsed.data;

  const createUserResult = await adminClient.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.full_name,
      role: values.role,
    },
  });

  const createdUser = createUserResult.data;
  const createUserError = createUserResult.error;

  if (createUserError || !createdUser.user) {
    return {
      error: createUserError?.message ?? "Failed to create user",
    };
  }

  const profileUpdateResult = await (adminClient as any)
    .from("profiles")
    .update({
      full_name: values.full_name,
      email: values.email,
      role: values.role,
      job_title: values.job_title || null,
      phone: values.phone || null,
      is_active: true,
    })
    .eq("id", createdUser.user.id);

  if (profileUpdateResult.error) {
    return {
      error: String(
        profileUpdateResult.error.message || profileUpdateResult.error
      ),
    };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "user",
    entity_id: createdUser.user.id,
    action: "created",
    description: `Created user account for ${values.full_name}`,
  });

  revalidatePath("/users");
  redirect("/users");
}