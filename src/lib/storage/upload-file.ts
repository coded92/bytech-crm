import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

type UploadFileArgs = {
  bucket: "branding" | "payment-proofs" | "attachments";
  file: File;
  folder: string;
};

export async function uploadFileToStorage({
  bucket,
  file,
  folder,
}: UploadFileArgs) {
  const supabase = await createClient();

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()
    : "";
  const safeExtension = extension ? `.${extension}` : "";
  const filePath = `${folder}/${randomUUID()}${safeExtension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  return {
    filePath,
    fileName: file.name,
    mimeType: file.type || null,
    fileSize: file.size || null,
  };
}