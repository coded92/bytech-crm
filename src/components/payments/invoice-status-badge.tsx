import { Badge } from "@/components/ui/badge";

type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

const labelMap: Record<InvoiceStatus, string> = {
  pending: "Pending",
  partial: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  waived: "Waived",
};

export function InvoiceStatusBadge({
  status,
}: {
  status: InvoiceStatus;
}) {
  const styles: Record<InvoiceStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    partial: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    waived: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return <Badge className={styles[status]}>{labelMap[status]}</Badge>;
}