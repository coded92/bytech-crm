import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string;
  description?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "slate";
};

export function StatsCard({
  title,
  value,
  description,
  tone = "slate",
}: StatsCardProps) {
  const toneMap = {
    indigo: "from-indigo-500/15 to-indigo-100 border-indigo-200",
    emerald: "from-emerald-500/15 to-emerald-100 border-emerald-200",
    amber: "from-amber-500/15 to-amber-100 border-amber-200",
    rose: "from-rose-500/15 to-rose-100 border-rose-200",
    slate: "from-slate-500/10 to-slate-100 border-slate-200",
  };

  return (
    <Card className={`border bg-gradient-to-br ${toneMap[tone]} shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-600 sm:text-sm">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-slate-900 sm:text-3xl">{value}</div>
        {description ? (
          <p className="mt-2 text-[11px] text-slate-500 sm:text-xs">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}