import { Badge } from "@/components/ui/badge";

type AssetCondition = "new" | "good" | "faulty" | "under_repair" | "retired";

export function AssetConditionBadge({
  condition,
}: {
  condition: AssetCondition;
}) {
  const styles: Record<AssetCondition, string> = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    good: "bg-green-50 text-green-700 border-green-200",
    faulty: "bg-red-50 text-red-700 border-red-200",
    under_repair: "bg-amber-50 text-amber-700 border-amber-200",
    retired: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const labels: Record<AssetCondition, string> = {
    new: "New",
    good: "Good",
    faulty: "Faulty",
    under_repair: "Under Repair",
    retired: "Retired",
  };

  return <Badge className={styles[condition]}>{labels[condition]}</Badge>;
}