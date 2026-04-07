import { Badge } from "@/components/ui/badge";

type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

const labelMap: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

export function QuotationStatusBadge({
  status,
}: {
  status: QuotationStatus;
}) {
  const styles: Record<QuotationStatus, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    accepted: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    expired: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return <Badge className={styles[status]}>{labelMap[status]}</Badge>;
}