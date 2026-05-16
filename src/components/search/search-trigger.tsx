"use client";

import { Search } from "lucide-react";

type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">
          Search customers, leads, invoices, projects...
        </span>
      </span>

      <span className="hidden shrink-0 items-center gap-1 sm:flex">
        <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          ⌘
        </kbd>
        <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          K
        </kbd>
      </span>
    </button>
  );
}
