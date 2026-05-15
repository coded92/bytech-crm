import type { createClient } from "@/lib/supabase/server";
import {
  getModuleForRelatedTable,
  requirePermission,
  type PermissionAction,
} from "@/lib/auth/require-permission";

export type StorageBucket =
  | "attachments"
  | "payment-proofs"
  | "branding"
  | "site"
  | "crm-private"
  | "crm-public";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type FilePolicy = {
  maxSizeBytes: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
};

type RelatedTableRule = {
  moduleName: string;
  tableName: string;
  allowedBuckets: readonly StorageBucket[];
  folderPrefixes: readonly string[];
};

const mb = 1024 * 1024;

const allowedBuckets = new Set<StorageBucket>([
  "attachments",
  "payment-proofs",
  "branding",
  "site",
  "crm-private",
  "crm-public",
]);

const executableExtensions = new Set([
  "apk",
  "app",
  "bat",
  "bin",
  "cmd",
  "com",
  "cpl",
  "dmg",
  "exe",
  "gadget",
  "hta",
  "html",
  "jar",
  "js",
  "jsx",
  "msi",
  "msp",
  "php",
  "ps1",
  "py",
  "rb",
  "scr",
  "sh",
  "svg",
  "ts",
  "tsx",
  "vb",
  "vbs",
  "wsf",
]);

const commonDocumentMimeTypes = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

const commonDocumentExtensions = [
  "pdf",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
] as const;

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const imageExtensions = ["jpg", "jpeg", "png", "webp"] as const;

const bucketPolicies: Record<StorageBucket, FilePolicy> = {
  attachments: {
    maxSizeBytes: 10 * mb,
    mimeTypes: [...imageMimeTypes, ...commonDocumentMimeTypes],
    extensions: [...imageExtensions, ...commonDocumentExtensions],
  },
  "payment-proofs": {
    maxSizeBytes: 5 * mb,
    mimeTypes: [...imageMimeTypes, "application/pdf"],
    extensions: [...imageExtensions, "pdf"],
  },
  branding: {
    maxSizeBytes: 2 * mb,
    mimeTypes: imageMimeTypes,
    extensions: imageExtensions,
  },
  site: {
    maxSizeBytes: 10 * mb,
    mimeTypes: [...imageMimeTypes, ...commonDocumentMimeTypes],
    extensions: [...imageExtensions, ...commonDocumentExtensions],
  },
  "crm-private": {
    maxSizeBytes: 10 * mb,
    mimeTypes: [...imageMimeTypes, ...commonDocumentMimeTypes],
    extensions: [...imageExtensions, ...commonDocumentExtensions],
  },
  "crm-public": {
    maxSizeBytes: 10 * mb,
    mimeTypes: [...imageMimeTypes, ...commonDocumentMimeTypes],
    extensions: [...imageExtensions, ...commonDocumentExtensions],
  },
};

const relatedTableRules: Record<string, RelatedTableRule> = {
  field_jobs: {
    moduleName: "field_jobs",
    tableName: "field_jobs",
    allowedBuckets: ["attachments"],
    folderPrefixes: ["field-jobs"],
  },
  projects: {
    moduleName: "projects",
    tableName: "projects",
    allowedBuckets: ["attachments"],
    folderPrefixes: ["projects"],
  },
  receipts: {
    moduleName: "payments",
    tableName: "receipts",
    allowedBuckets: ["payment-proofs"],
    folderPrefixes: ["receipts"],
  },
  support_tickets: {
    moduleName: "support",
    tableName: "support_tickets",
    allowedBuckets: ["attachments"],
    folderPrefixes: ["support"],
  },
};

// Future Nexus/AI attachment types should be added here with explicit module,
// bucket, folder, and entity-access rules before they can upload or download.

function getExtension(fileName: string) {
  const cleanName = fileName.split(/[\\/]/).pop() ?? "";
  const lastDotIndex = cleanName.lastIndexOf(".");

  if (lastDotIndex < 0 || lastDotIndex === cleanName.length - 1) {
    return "";
  }

  return cleanName.slice(lastDotIndex + 1).toLowerCase();
}

function normalizeFileName(fileName: string, extension: string) {
  const baseName =
    fileName
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 80) || "file";

  return extension ? `${baseName}.${extension}` : baseName;
}

export function assertAllowedBucket(bucket: string): asserts bucket is StorageBucket {
  if (!allowedBuckets.has(bucket as StorageBucket)) {
    throw new Error("Storage bucket is not allowed.");
  }
}

export function sanitizeStorageFolder(folder: string) {
  const segments = folder
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    throw new Error("Storage folder is required.");
  }

  const safeSegments = segments.map((segment) => {
    if (segment === "." || segment === "..") {
      throw new Error("Storage folder contains an invalid path segment.");
    }

    const safeSegment = segment
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "");

    if (!safeSegment) {
      throw new Error("Storage folder contains an invalid path segment.");
    }

    return safeSegment;
  });

  return safeSegments.join("/");
}

export function assertSafeStoragePath(filePath: string) {
  const sanitizedPath = sanitizeStorageFolder(filePath);

  if (sanitizedPath !== filePath.toLowerCase()) {
    throw new Error("Stored file path is invalid.");
  }
}

export function validateUploadFile(args: {
  bucket: string;
  file: File;
  folder: string;
}) {
  const { bucket, file, folder } = args;
  assertAllowedBucket(bucket);

  if (!file || file.size <= 0) {
    throw new Error("Please select a file.");
  }

  const policy = bucketPolicies[bucket];

  if (file.size > policy.maxSizeBytes) {
    throw new Error(
      `File is too large. Maximum size is ${Math.floor(policy.maxSizeBytes / mb)}MB.`
    );
  }

  const extension = getExtension(file.name);

  if (!extension) {
    throw new Error("File must have an extension.");
  }

  if (executableExtensions.has(extension)) {
    throw new Error("Executable or script file types are not allowed.");
  }

  if (!policy.extensions.includes(extension)) {
    throw new Error("File extension is not allowed for this upload.");
  }

  const mimeType = file.type || "application/octet-stream";

  if (!policy.mimeTypes.includes(mimeType)) {
    throw new Error("File type is not allowed for this upload.");
  }

  return {
    bucket,
    extension,
    mimeType,
    safeFolder: sanitizeStorageFolder(folder),
    safeFileName: normalizeFileName(file.name, extension),
  };
}

export function getRelatedTableRule(relatedTable: string) {
  return relatedTableRules[relatedTable] ?? null;
}

export async function assertRelatedEntityAccess(args: {
  supabase: SupabaseServerClient;
  relatedTable: string;
  relatedId: string;
  bucket: string;
  folder: string;
  action: PermissionAction;
}) {
  const { supabase, relatedTable, relatedId, bucket, folder, action } = args;
  const rule = getRelatedTableRule(relatedTable);

  if (!rule) {
    throw new Error("Attachment related table is not allowed.");
  }

  assertAllowedBucket(bucket);

  if (!rule.allowedBuckets.includes(bucket)) {
    throw new Error("Storage bucket is not allowed for this entity.");
  }

  const safeFolder = sanitizeStorageFolder(folder);
  const isAllowedFolder = rule.folderPrefixes.some(
    (prefix) => safeFolder === prefix || safeFolder.startsWith(`${prefix}/`)
  );

  if (!isAllowedFolder) {
    throw new Error("Storage folder is not allowed for this entity.");
  }

  const profile = await requirePermission(rule.moduleName, action);

  const { data, error } = await (supabase as any)
    .from(rule.tableName)
    .select("id")
    .eq("id", relatedId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Related record not found or inaccessible.");
  }

  return {
    bucket,
    moduleName: rule.moduleName,
    profile,
    safeFolder,
  };
}

export function getModuleForAttachmentTable(relatedTable: string) {
  const rule = getRelatedTableRule(relatedTable);

  return rule?.moduleName ?? getModuleForRelatedTable(relatedTable);
}
