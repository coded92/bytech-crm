"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertRelatedEntityAccess } from "@/lib/storage/file-security";
import { uploadFileToStorage } from "@/lib/storage/upload-file";

type UploadAttachmentArgs = {
  relatedTable: string;
  relatedId: string;
  bucket: string;
  folder: string;
  file: File;
  revalidatePaths?: string[];
};

export async function uploadAttachmentAction({
  relatedTable,
  relatedId,
  bucket,
  folder,
  file,
  revalidatePaths = [],
}: UploadAttachmentArgs) {
  const supabase = await createClient();

  if (!file || file.size === 0) {
    return { error: "Please select a file" };
  }

  let access;
  try {
    access = await assertRelatedEntityAccess({
      supabase,
      relatedTable,
      relatedId,
      bucket,
      folder,
      action: "create",
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Attachment access denied",
    };
  }

  const uploadResult = await uploadFileToStorage({
    bucket: access.bucket,
    file,
    folder: access.safeFolder,
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { error } = await (supabase as any).from("file_attachments").insert({
    related_table: relatedTable,
    related_id: relatedId,
    bucket_name: access.bucket,
    file_path: uploadResult.filePath,
    file_name: uploadResult.fileName,
    mime_type: uploadResult.mimeType,
    file_size: uploadResult.fileSize,
    uploaded_by: access.profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  return { success: true };
}
