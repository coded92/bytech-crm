"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  assertAllowedBucket,
  assertRelatedEntityAccess,
  assertSafeStoragePath,
} from "@/lib/storage/file-security";

type AttachmentRow = {
  id: string;
  bucket_name: string;
  file_path: string;
  related_table: string;
  related_id: string;
};

export async function getAttachmentSignedUrlAction(attachmentId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("file_attachments")
    .select("id, bucket_name, file_path, related_table, related_id")
    .eq("id", attachmentId)
    .maybeSingle();

  const attachment = data as AttachmentRow | null;

  if (error || !attachment) {
    return { error: error?.message ?? "Attachment not found" };
  }

  try {
    assertAllowedBucket(attachment.bucket_name);
    assertSafeStoragePath(attachment.file_path);
    await assertRelatedEntityAccess({
      supabase,
      relatedTable: attachment.related_table,
      relatedId: attachment.related_id,
      bucket: attachment.bucket_name,
      folder: attachment.file_path.split("/").slice(0, -1).join("/"),
      action: "read",
    });
  } catch (accessError) {
    return {
      error:
        accessError instanceof Error ? accessError.message : "Attachment access denied",
    };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(attachment.bucket_name)
    .createSignedUrl(attachment.file_path, 60 * 2);

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

  const { data, error } = await (supabase as any)
    .from("file_attachments")
    .select("id, bucket_name, file_path, related_table, related_id")
    .eq("id", attachmentId)
    .maybeSingle();

  const attachment = data as AttachmentRow | null;

  if (error || !attachment) {
    return { error: error?.message ?? "Attachment not found" };
  }

  let access;
  try {
    assertAllowedBucket(attachment.bucket_name);
    assertSafeStoragePath(attachment.file_path);
    access = await assertRelatedEntityAccess({
      supabase,
      relatedTable: attachment.related_table,
      relatedId: attachment.related_id,
      bucket: attachment.bucket_name,
      folder: attachment.file_path.split("/").slice(0, -1).join("/"),
      action: "delete",
    });
  } catch (accessError) {
    return {
      error:
        accessError instanceof Error ? accessError.message : "Attachment access denied",
    };
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
    actor_id: access.profile.id,
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
