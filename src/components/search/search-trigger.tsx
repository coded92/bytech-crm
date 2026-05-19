"use client";

import { Search } from "lucide-react";

type SearchTriggerProps = {
  keyboardShortcutsEnabled?: boolean;
  onClick: () => void;
};

export function SearchTrigger({
  keyboardShortcutsEnabled = true,
  onClick,
}: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/92 px-3.5 py-2.5 text-left text-sm font-medium text-slate-500 shadow-sm shadow-indigo-100 outline-none transition hover:border-indigo-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30"
      aria-label="Open CRM search and command palette"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Search className="size-4 shrink-0 text-slate-400" />
        <span className="hidden truncate sm:inline">
          Search anything...
        </span>
        <span className="truncate sm:hidden">
          Search...
        </span>
      </span>

      {keyboardShortcutsEnabled ? (
        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          <kbd className="rounded-lg border border-indigo-100 bg-[#F1F0FC] px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
            ⌘
          </kbd>
          <kbd className="rounded-lg border border-indigo-100 bg-[#F1F0FC] px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
            K
          </kbd>
        </span>
      ) : null}
    </button>
  );
}
