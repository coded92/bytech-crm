import { AttachmentActions } from "@/components/shared/attachment-actions";

type PhotoRow = {
  id: string;
  photo_type: "before" | "after" | "inspection" | "materials" | "other";
  caption: string | null;
  attachment: {
    id: string;
    file_name: string;
    mime_type: string | null;
    created_at: string;
  } | null;
};

const PHOTO_TYPES: Array<PhotoRow["photo_type"]> = [
  "before",
  "after",
  "inspection",
  "materials",
  "other",
];

export function FieldJobPhotoGallery({
  photos,
  fieldJobId,
}: {
  photos: PhotoRow[];
  fieldJobId: string;
}) {
  return (
    <div className="space-y-6">
      {PHOTO_TYPES.map((type) => {
        const items = photos.filter((photo) => photo.photo_type === type);

        return (
          <div key={type}>
            <h4 className="mb-3 text-sm font-semibold capitalize text-slate-900">
              {type.replaceAll("_", " ")} Photos
            </h4>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No {type.replaceAll("_", " ")} photos yet.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.attachment?.file_name || "Photo"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.caption || "-"}
                        </p>
                      </div>

                      {item.attachment?.id ? (
                        <AttachmentActions
                          attachmentId={item.attachment.id}
                          canDelete={true}
                          revalidatePaths={[`/field-jobs/${fieldJobId}`]}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}