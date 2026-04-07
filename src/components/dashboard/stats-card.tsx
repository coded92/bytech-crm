import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: string;
  description?: string;
};

export function StatsCard({
  title,
  value,
  description,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        {description ? (
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}