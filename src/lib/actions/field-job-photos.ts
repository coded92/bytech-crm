"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadFileToStorage } from "@/lib/storage/upload-file";

type PhotoType = "before" | "after" | "inspection" | "materials" | "other";

type CreatedAttachmentRow = {
  id: string;
};

export async function uploadFieldJobPhotoAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const fieldJobId = String(formData.get("field_job_id") || "");
  const photoType = String(formData.get("photo_type") || "") as PhotoType;
  const caption = String(formData.get("caption") || "");
  const fileEntry = formData.get("photo");

  if (!fieldJobId) {
    return { error: "Field job is required" };
  }

  if (
    !["before", "after", "inspection", "materials", "other"].includes(photoType)
  ) {
    return { error: "Invalid photo type" };
  }

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { error: "Please choose a photo" };
  }

  const uploadResult = await uploadFileToStorage({
    bucket: "attachments",
    file: fileEntry,
    folder: `field-jobs/${fieldJobId}`,
  });

  if ("error" in uploadResult) {
    return { error: uploadResult.error };
  }

  const { data: attachmentData, error: attachmentError } = await (supabase as any)
    .from("file_attachments")
    .insert({
      related_table: "field_jobs",
      related_id: fieldJobId,
      bucket_name: "attachments",
      file_path: uploadResult.filePath,
      file_name: uploadResult.fileName,
      mime_type: uploadResult.mimeType,
      file_size: uploadResult.fileSize,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  const attachment = attachmentData as CreatedAttachmentRow | null;

  if (attachmentError || !attachment) {
    return {
      error: attachmentError?.message ?? "Failed to save attachment record",
    };
  }

  const { error: photoError } = await (supabase as any)
    .from("field_job_photos")
    .insert({
      field_job_id: fieldJobId,
      photo_type: photoType,
      file_attachment_id: attachment.id,
      caption: caption || null,
      uploaded_by: user.id,
    });

  if (photoError) {
    return { error: photoError.message };
  }

  await (supabase as any).from("activity_logs").insert({
    actor_id: user.id,
    entity_type: "field_job",
    entity_id: fieldJobId,
    action: "photo_uploaded",
    description: `Uploaded ${photoType} photo for field job`,
  });

  revalidatePath(`/field-jobs/${fieldJobId}`);
  return { success: true };
}