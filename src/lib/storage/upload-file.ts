import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import {
  type StorageBucket,
  validateUploadFile,
} from "@/lib/storage/file-security";

type UploadFileArgs = {
  bucket: StorageBucket;
  file: File;
  folder: string;
};

export async function uploadFileToStorage({
  bucket,
  file,
  folder,
}: UploadFileArgs) {
  const supabase = await createClient();
  let validation;

  try {
    validation = validateUploadFile({ bucket, file, folder });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid upload file",
    };
  }

  const filePath = `${validation.safeFolder}/${randomUUID()}.${validation.extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: validation.mimeType,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  return {
    filePath,
    fileName: validation.safeFileName,
    mimeType: validation.mimeType,
    fileSize: file.size || null,
  };
}
