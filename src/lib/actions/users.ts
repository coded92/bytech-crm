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

type UserDepartment =
  | "sales"
  | "operations"
  | "support"
  | "engineering"
  | "inventory"
  | "finance"
  | "hr";

function buildFullName(firstName: string, lastName?: string) {
  return `${firstName} ${lastName ?? ""}`.trim();
}

async function requireAdminContext() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", supabase: null, adminClient: null, user: null };
  }

  const { data: profileData, error } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as { role: "admin" | "staff" } | null;

  if (error || !profile || profile.role !== "admin") {
    return {
      error: "Only admins can perform this action.",
      supabase: null,
      adminClient: null,
      user: null,
    };
  }

  return { error: null, supabase, adminClient, user };
}

export async function createUserAction(
  formData: FormData
): Promise<ActionResponse | never> {
  const ctx = await requireAdminContext();

  if (ctx.error || !ctx.supabase || !ctx.adminClient || !ctx.user) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const parsed = createUserSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    department: formData.get("department"),
    job_title: formData.get("job_title") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    hire_date: formData.get("hire_date") || undefined,
    birthday: formData.get("birthday") || undefined,
    employee_number: formData.get("employee_number") || undefined,
    force_password_change: formData.get("force_password_change") === "on",
    allowed_modules: formData.getAll("allowed_modules"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid user data" };
  }

  const values = parsed.data as typeof parsed.data & {
    department: UserDepartment;
  };
  const fullName = buildFullName(values.first_name, values.last_name);

  const createUserResult = await ctx.adminClient.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: values.first_name,
      last_name: values.last_name || null,
      role: values.role,
      department: values.department,
      force_password_change: values.force_password_change,
    },
  });

  const createdUser = createUserResult.data.user;

  if (createUserResult.error || !createdUser) {
    return { error: createUserResult.error?.message ?? "Failed to create user" };
  }

  const { error: profileUpdateError } = await (ctx.adminClient as any)
    .from("profiles")
    .upsert({
      id: createdUser.id,
      full_name: fullName,
      first_name: values.first_name,
      last_name: values.last_name || null,
      email: values.email,
      role: values.role,
      department: values.department,
      job_title: values.job_title || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      hire_date: values.hire_date || null,
      birthday: values.birthday || null,
      employee_number: values.employee_number || null,
      force_password_change: values.force_password_change,
      allowed_modules: values.allowed_modules,
      is_active: true,
    })
    .eq("id", createdUser.id);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  await (ctx.supabase as any).from("activity_logs").insert({
    actor_id: ctx.user.id,
    entity_type: "user",
    entity_id: createdUser.id,
    action: "created",
    description: `Created user account for ${fullName}`,
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
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || undefined,
    email: formData.get("email"),
    role: formData.get("role"),
    department: formData.get("department"),
    job_title: formData.get("job_title") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    hire_date: formData.get("hire_date") || undefined,
    birthday: formData.get("birthday") || undefined,
    employee_number: formData.get("employee_number") || undefined,
    force_password_change: formData.get("force_password_change") === "on",
    allowed_modules: formData.getAll("allowed_modules"),
    is_active: formData.get("is_active"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid user data" };
  }

  const values = parsed.data as typeof parsed.data & {
    department: UserDepartment;
  };
  const fullName = buildFullName(values.first_name, values.last_name);

  if (userId === ctx.user.id && values.role !== "admin") {
    return { error: "You cannot remove your own admin role." };
  }

  if (userId === ctx.user.id && values.is_active !== "true") {
    return { error: "You cannot deactivate your own account." };
  }

  const { error: profileUpdateError } = await (ctx.adminClient as any)
    .from("profiles")
    .update({
      full_name: fullName,
      first_name: values.first_name,
      last_name: values.last_name || null,
      email: values.email,
      role: values.role,
      department: values.department,
      job_title: values.job_title || null,
      phone: values.phone || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      hire_date: values.hire_date || null,
      birthday: values.birthday || null,
      employee_number: values.employee_number || null,
      force_password_change: values.force_password_change,
      allowed_modules: values.allowed_modules,
      is_active: values.is_active === "true",
    })
    .eq("id", userId);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  const authUpdateResult = await ctx.adminClient.auth.admin.updateUserById(
    userId,
    {
      email: values.email,
      user_metadata: {
        full_name: fullName,
        first_name: values.first_name,
        last_name: values.last_name || null,
        role: values.role,
        department: values.department,
        force_password_change: values.force_password_change,
      },
    }
  );

  if (authUpdateResult.error) {
    return { error: authUpdateResult.error.message };
  }

  await (ctx.supabase as any).from("activity_logs").insert({
    actor_id: ctx.user.id,
    entity_type: "user",
    entity_id: userId,
    action: "updated",
    description: `Updated user account for ${fullName}`,
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

  if (ctx.error || !ctx.adminClient || !ctx.user) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  if (userId === ctx.user.id) {
    return { error: "You cannot deactivate your own account." };
  }

  const { error } = await (ctx.adminClient as any)
    .from("profiles")
    .update({ is_active: nextValue })
    .eq("id", userId);

  if (error) return { error: error.message };

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

  if (result.error) return { error: result.error.message };

  return { success: true };
}
