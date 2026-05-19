"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { logSecurityEvent } from "@/lib/security/events";
import { uploadFileToStorage } from "@/lib/storage/upload-file";
import {
  updateMyPreferencesSchema,
  updateMyProfileSchema,
} from "@/lib/validations/profile";

type ActionResponse =
  | { success: true; avatarPath?: string }
  | { error: string };

const avatarMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const avatarExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
const maxAvatarSizeBytes = 2 * 1024 * 1024;

function buildFullName(firstName: string, lastName: string | null) {
  return `${firstName} ${lastName ?? ""}`.trim();
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function updateMyProfileAction(
  formData: FormData
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsed = updateMyProfileSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data" };
  }

  const values = parsed.data;
  const fullName = buildFullName(values.first_name, values.last_name);

  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      first_name: values.first_name,
      last_name: values.last_name,
      full_name: fullName,
      phone: values.phone,
      address: values.address,
      city: values.city,
      state: values.state,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "user",
    entity_id: profile.id,
    action: "profile_updated",
    description: "Updated personal profile information",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "profile_updated",
  });

  revalidatePath("/dashboard");
  revalidatePath(`/users/${profile.id}`);
  revalidatePath(`/users/${profile.id}/edit`);

  return { success: true };
}

export async function updateMyPreferencesAction(
  formData: FormData
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsed = updateMyPreferencesSchema.safeParse({
    theme: formData.get("theme") || "light",
    language: formData.get("language") || "en",
    timezone: formData.get("timezone") || "UTC",
    compact_mode: formBoolean(formData, "compact_mode"),
    email_notifications: formBoolean(formData, "email_notifications"),
    push_notifications: formBoolean(formData, "push_notifications"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid preferences data",
    };
  }

  const { error } = await (supabase as any).from("user_preferences").upsert({
    user_id: profile.id,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "user",
    entity_id: profile.id,
    action: "preferences_updated",
    description: "Updated personal profile preferences",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "preferences_updated",
    metadata: {
      theme: parsed.data.theme,
      compact_mode: parsed.data.compact_mode,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/users/${profile.id}`);

  return { success: true };
}

export async function uploadMyAvatarAction(
  formData: FormData
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const fileEntry = formData.get("avatar");

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { error: "Please choose a profile photo." };
  }

  const extension = fileEntry.name.split(".").pop()?.toLowerCase() ?? "";

  if (!avatarMimeTypes.has(fileEntry.type) || !avatarExtensions.has(extension)) {
    return { error: "Profile photo must be a JPG, PNG, or WebP image." };
  }

  if (fileEntry.size > maxAvatarSizeBytes) {
    return { error: "Profile photo must be 2MB or smaller." };
  }

  const uploadResult = await uploadFileToStorage({
    bucket: "crm-private",
    file: fileEntry,
    folder: `profiles/${profile.id}/avatar`,
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error ?? "Avatar upload failed." };
  }

  const avatarPath = uploadResult.filePath;

  if (!avatarPath) {
    return { error: "Avatar upload did not return a storage path." };
  }

  const { error } = await (supabase as any)
    .from("profiles")
    .update({
      avatar_url: avatarPath,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: profile.id,
    entity_type: "user",
    entity_id: profile.id,
    action: "avatar_uploaded",
    description: "Uploaded a new profile photo",
  });

  await logSecurityEvent({
    userId: profile.id,
    eventType: "avatar_updated",
    metadata: {
      storage_path: avatarPath,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/users/${profile.id}`);

  return { success: true, avatarPath };
}
