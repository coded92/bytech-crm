"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/validations/user";

type ActionResponse = { success: true } | { error: string };

async function requireAdminContext() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", supabase: null, adminClient: null, user: null };
  }

  const profileResult = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileResult.data as { role: string } | null;

  if (!profile || profile.role !== "admin") {
    return {
      error: "Only admins can perform this action.",
      supabase: null,
      adminClient: null,
      user: null,
    };
  }

  return {
    error: null,
    supabase,
    adminClient,
    user,
  };
}

export async function createUserAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.supabase || !ctx.adminClient || !ctx.user) {
    return { error: ctx.error ?? "Unauthorized" };
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

  const createUserResult = await ctx.adminClient.auth.admin.createUser({
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

  const profileUpdateResult = await (ctx.adminClient as any)
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

  await (ctx.supabase as any).from("activity_logs").insert({
    actor_id: ctx.user.id,
    entity_type: "user",
    entity_id: createdUser.user.id,
    action: "created",
    description: `Created user account for ${values.full_name}`,
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUserAction(
  userId: string,
  formData: FormData
): Promise<ActionResponse | never> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.supabase || !ctx.adminClient || !ctx.user) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = updateUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    job_title: formData.get("job_title") || undefined,
    phone: formData.get("phone") || undefined,
    is_active: formData.get("is_active"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid user data",
    };
  }

  const values = parsed.data;

  const profileUpdateResult = await (ctx.adminClient as any)
    .from("profiles")
    .update({
      full_name: values.full_name,
      email: values.email,
      role: values.role,
      job_title: values.job_title || null,
      phone: values.phone || null,
      is_active: values.is_active === "true",
    })
    .eq("id", userId);

  if (profileUpdateResult.error) {
    return {
      error: String(
        profileUpdateResult.error.message || profileUpdateResult.error
      ),
    };
  }

  const authUpdateResult = await ctx.adminClient.auth.admin.updateUserById(
    userId,
    {
      email: values.email,
      user_metadata: {
        full_name: values.full_name,
        role: values.role,
      },
    }
  );

  if (authUpdateResult.error) {
    return {
      error: authUpdateResult.error.message,
    };
  }

  await (ctx.supabase as any).from("activity_logs").insert({
    actor_id: ctx.user.id,
    entity_type: "user",
    entity_id: userId,
    action: "updated",
    description: `Updated user account for ${values.full_name}`,
  });

  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
  revalidatePath(`/users/${userId}/edit`);

  redirect(`/users/${userId}`);
}

export async function toggleUserActiveAction(
  userId: string,
  nextValue: boolean
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.supabase || !ctx.adminClient || !ctx.user) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const result = await (ctx.adminClient as any)
    .from("profiles")
    .update({ is_active: nextValue })
    .eq("id", userId);

  if (result.error) {
    return {
      error: String(result.error.message || result.error),
    };
  }

  await (ctx.supabase as any).from("activity_logs").insert({
    actor_id: ctx.user.id,
    entity_type: "user",
    entity_id: userId,
    action: nextValue ? "activated" : "deactivated",
    description: nextValue
      ? "Activated user account"
      : "Deactivated user account",
  });

  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);

  return { success: true };
}

export async function sendPasswordResetAction(
  email: string
): Promise<ActionResponse> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.adminClient) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const result = await ctx.adminClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
  });

  if (result.error) {
    return { error: result.error.message };
  }

  return { success: true };
}