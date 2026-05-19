"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartItem = {
  name: string;
  value: number;
};

function hasValidChartData(data: ChartItem[]) {
  return data.some(
    (item) =>
      typeof item.name === "string" &&
      item.name.length > 0 &&
      Number.isFinite(item.value),
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[18rem] w-full items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 text-center text-sm font-medium text-slate-500">
      No chart data available
    </div>
  );
}

export function DashboardCharts({
  titleOne,
  titleTwo,
  chartOneData,
  chartTwoData,
}: {
  titleOne: string;
  titleTwo: string;
  chartOneData: ChartItem[];
  chartTwoData: ChartItem[];
}) {
  const hasChartOneData = hasValidChartData(chartOneData);
  const hasChartTwoData = hasValidChartData(chartTwoData);

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Card className="min-w-0 rounded-[1.5rem] border-white/80 bg-white/88 py-0 shadow-lg shadow-indigo-100/50 backdrop-blur">
        <CardHeader className="border-b border-indigo-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Analytics
          </p>
          <CardTitle className="mt-1 text-base font-semibold text-slate-950">
            {titleOne}
          </CardTitle>
        </CardHeader>

        <CardContent className="min-w-0 px-5 py-5">
          <div className="h-72 min-h-[18rem] w-full min-w-0">
            {hasChartOneData ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chartOneData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} width={48} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 rounded-[1.5rem] border-white/80 bg-white/88 py-0 shadow-lg shadow-indigo-100/50 backdrop-blur">
        <CardHeader className="border-b border-indigo-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Operations
          </p>
          <CardTitle className="mt-1 text-base font-semibold text-slate-950">
            {titleTwo}
          </CardTitle>
        </CardHeader>

        <CardContent className="min-w-0 px-5 py-5">
          <div className="h-72 min-h-[18rem] w-full min-w-0">
            {hasChartTwoData ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chartTwoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} width={48} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
