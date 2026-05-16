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
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Analytics
          </p>
          <CardTitle className="mt-1 text-base font-semibold text-slate-950">
            {titleOne}
          </CardTitle>
        </CardHeader>

        <CardContent className="h-72 px-5 py-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartOneData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={48} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white py-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Operations
          </p>
          <CardTitle className="mt-1 text-base font-semibold text-slate-950">
            {titleTwo}
          </CardTitle>
        </CardHeader>

        <CardContent className="h-72 px-5 py-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartTwoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={48} />
              <Tooltip />
              <Bar dataKey="value" fill="#334155" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
