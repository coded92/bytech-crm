type AttachmentRow = {
  id: string;
  file_name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export function AttachmentList({
  attachments,
}: {
  attachments: AttachmentRow[];
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
          <p className="font-medium text-slate-900">{item.file_name}</p>
          <p className="mt-1 text-slate-500">{item.bucket_name}</p>
          <p className="mt-1 text-slate-500">{item.mime_type || "-"}</p>
        </div>
      ))}
    </div>
  );
}