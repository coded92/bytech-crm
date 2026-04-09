import { formatDateTime } from "@/lib/utils/format-date";
import { AttachmentActions } from "@/components/shared/attachment-actions";

type AttachmentRow = {
  id: string;
  file_name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

function formatFileSize(size: number | null) {
  if (!size || size <= 0) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  attachments,
  canDelete = false,
  revalidatePaths = [],
}: {
  attachments: AttachmentRow[];
  canDelete?: boolean;
  revalidatePaths?: string[];
}) {
  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No files uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {attachments.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-slate-200 p-4 text-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {item.file_name}
              </p>
              <p className="mt-1 text-slate-500">{item.bucket_name}</p>
              <p className="mt-1 text-slate-500">{item.mime_type || "-"}</p>
              <p className="mt-1 text-slate-500">
                {formatFileSize(item.file_size)} · {formatDateTime(item.created_at)}
              </p>
            </div>

            <AttachmentActions
              attachmentId={item.id}
              canDelete={canDelete}
              revalidatePaths={revalidatePaths}
            />
          </div>
        </div>
      ))}
    </div>
  );
}