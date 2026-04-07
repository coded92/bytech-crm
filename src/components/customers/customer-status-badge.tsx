import { Badge } from "@/components/ui/badge";

type CustomerStatus = "active" | "inactive" | "suspended";

const labelMap: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
};

export function CustomerStatusBadge({
  status,
}: {
  status: CustomerStatus;
}) {
  const styles: Record<CustomerStatus, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
  };

  return <Badge className={styles[status]}>{labelMap[status]}</Badge>;
}