import { ReportForm } from "@/components/reports/report-form";

export default function NewReportPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Submit Daily Report
        </h2>
        <p className="text-slate-600">
          Add your performance summary and next-day plan.
        </p>
      </div>

      <ReportForm defaultDate={today} />
    </div>
  );
}