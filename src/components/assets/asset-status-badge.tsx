import { Badge } from "@/components/ui/badge";

type AssetStatus = "active" | "inactive" | "lost" | "retired";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const styles: Record<AssetStatus, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-amber-50 text-amber-700 border-amber-200",
    lost: "bg-red-50 text-red-700 border-red-200",
    retired: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<AssetStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    lost: "Lost",
    retired: "Retired",
  };

  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}