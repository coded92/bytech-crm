import { Badge } from "@/components/ui/badge";

type FieldJobStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "awaiting_parts"
  | "completed"
  | "cancelled";

export function FieldJobStatusBadge({
  status,
}: {
  status: FieldJobStatus;
}) {
  const styles: Record<FieldJobStatus, string> = {
    pending: "bg-slate-100 text-slate-700 border-slate-200",
    assigned: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    awaiting_parts: "bg-orange-50 text-orange-700 border-orange-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const labels: Record<FieldJobStatus, string> = {
    pending: "Pending",
    assigned: "Assigned",
    in_progress: "In Progress",
    awaiting_parts: "Awaiting Parts",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}