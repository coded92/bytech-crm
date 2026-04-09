type DateRangeFilterProps = {
  actionPath: string;
  from?: string;
  to?: string;
};

export function DateRangeFilter({
  actionPath,
  from,
  to,
}: DateRangeFilterProps) {
  return (
    <form
      action={actionPath}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="space-y-2">
        <label
          htmlFor="from"
          className="text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          From
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="to"
          className="text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          To
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="flex h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
      >
        Apply Filter
      </button>

      <a
        href={actionPath}
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700"
      >
        Reset
      </a>
    </form>
  );
}