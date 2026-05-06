import { Badge } from "@/components/ui/badge";

type ProjectStatus =
  | "proposal"
  | "approved"
  | "paid"
  | "planning"
  | "in_progress"
  | "review"
  | "completed"
  | "maintenance"
  | "on_hold"
  | "cancelled";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className="capitalize">
      {status.replaceAll("_", " ")}
    </Badge>
  );
}