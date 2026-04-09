"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AttachmentRow = {
  id: string;
  bucket_name: string;
  file_path: string;
};

export async function getAttachmentSignedUrlAction(attachmentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data, error } = await (supabase as any)
    .from("file_attachments")
    .select("id, bucket_name, file_path")
    .eq("id", attachmentId)
    .maybeSingle();

  const attachment = data as AttachmentRow | null;

  if (error || !attachment) {
    return { error: error?.message ?? "Attachment not found" };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(attachment.bucket_name)
    .createSignedUrl(attachment.file_path, 60 * 10);

  if (signedError || !signedData?.signedUrl) {
    return { error: signedError?.message ?? "Failed to generate file link" };
  }

  return { success: true, url: signedData.signedUrl };
}

export async function deleteAttachmentAction(args: {
  attachmentId: string;
  revalidatePaths?: string[];
}) {
  const { attachmentId, revalidatePaths = [] } = args;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as { role: "admin" | "staff" } | null;

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can delete attachments." };
  }

  const { data, error } = await (supabase as any)
    .from("file_attachments")
    .select("id, bucket_name, file_path")
    .eq("id", attachmentId)
    .maybeSingle();

  const attachment = data as AttachmentRow | null;

  if (error || !attachment) {
    return { error: error?.message ?? "Attachment not found" };
  }

  const { error: storageError } = await supabase.storage
    .from(attachment.bucket_name)
    .remove([attachment.file_path]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: deleteError } = await (supabase as any)
    .from("file_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "file_attachment",
    entity_id: attachmentId,
    action: "deleted",
    description: "Deleted file attachment",
  });

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  return { success: true };
}