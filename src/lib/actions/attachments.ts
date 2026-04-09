"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFileToStorage } from "@/lib/storage/upload-file";

type AttachmentBucket = "branding" | "payment-proofs" | "attachments";

type UploadAttachmentArgs = {
  relatedTable: string;
  relatedId: string;
  bucket: AttachmentBucket;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  if (!file || file.size === 0) {
    return { error: "Please select a file" };
  }

  const uploadResult = await uploadFileToStorage({
    bucket,
    file,
    folder,
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { error } = await (supabase as any).from("file_attachments").insert({
    related_table: relatedTable,
    related_id: relatedId,
    bucket_name: bucket,
    file_path: uploadResult.filePath,
    file_name: uploadResult.fileName,
    mime_type: uploadResult.mimeType,
    file_size: uploadResult.fileSize,
    uploaded_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  return { success: true };
}