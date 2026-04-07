import { Badge } from "@/components/ui/badge";

type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "closed_won"
  | "closed_lost";

const labelMap: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-up",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    new: "bg-slate-100 text-slate-700 border-slate-200",
    contacted: "bg-blue-50 text-blue-700 border-blue-200",
    interested: "bg-amber-50 text-amber-700 border-amber-200",
    follow_up: "bg-purple-50 text-purple-700 border-purple-200",
    closed_won: "bg-green-50 text-green-700 border-green-200",
    closed_lost: "bg-red-50 text-red-700 border-red-200",
  };

  return <Badge className={styles[status]}>{labelMap[status]}</Badge>;
}