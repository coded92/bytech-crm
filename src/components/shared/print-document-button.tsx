"use client";

import { Printer } from "lucide-react";

export function PrintDocumentButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-50 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </button>
  );
}
