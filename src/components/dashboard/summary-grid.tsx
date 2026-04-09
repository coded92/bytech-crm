type SummaryGridItem = {
  label: string;
  value: number;
};

export function SummaryGrid({
  title,
  items,
}: {
  title: string;
  items: SummaryGridItem[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}