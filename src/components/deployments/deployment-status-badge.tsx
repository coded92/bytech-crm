import { Badge } from "@/components/ui/badge";

type DeploymentStatus = "planned" | "in_progress" | "completed" | "cancelled";

export function DeploymentStatusBadge({
  status,
}: {
  status: DeploymentStatus;
}) {
  const styles: Record<DeploymentStatus, string> = {
    planned: "bg-amber-50 text-amber-700 border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<DeploymentStatus, string> = {
    planned: "Planned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}