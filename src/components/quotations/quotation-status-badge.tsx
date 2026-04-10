import { Badge } from "@/components/ui/badge";

type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

const statusStyles: Record<QuotationStatus, string> = {
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
};

export function QuotationStatusBadge({
  status,
}: {
  status: QuotationStatus;
}) {
  return (
    <Badge className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}