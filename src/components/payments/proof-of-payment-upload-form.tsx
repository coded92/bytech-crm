"use client";

import { useState, useTransition } from "react";
import { uploadAttachmentAction } from "@/lib/actions/attachments";
import { Button } from "@/components/ui/button";

export function ProofOfPaymentUploadForm({
  receiptId,
}: {
  receiptId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <form
      action={(formData) => {
        setError("");
        setSuccess("");

        startTransition(async () => {
          const fileEntry = formData.get("proof");

          if (!(fileEntry instanceof File)) {
            setError("Please choose a file");
            return;
          }

          const result = await uploadAttachmentAction({
            relatedTable: "receipts",
            relatedId: receiptId,
            bucket: "payment-proofs",
            folder: `receipts/${receiptId}`,
            file: fileEntry,
            revalidatePaths: [`/payments/receipts/${receiptId}`],
          });

          if (result?.error) {
            setError(result.error);
            return;
          }

          setSuccess("Proof of payment uploaded successfully.");
        });
      }}
      className="space-y-4"
    >
      <fieldset disabled={isPending} className="space-y-4">
        <input
          type="file"
          name="proof"
          className="block w-full text-sm text-slate-700"
        />

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
            {success}
          </div>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Uploading..." : "Upload Proof of Payment"}
        </Button>
      </fieldset>
    </form>
  );
}