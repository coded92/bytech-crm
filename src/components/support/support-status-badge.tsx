import { Badge } from "@/components/ui/badge";

type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  const styles: Record<SupportStatus, string> = {
    open: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<SupportStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };

  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}