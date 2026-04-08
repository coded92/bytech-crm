import { ReactNode } from "react";
import { PrintButton } from "@/components/shared/print-button";

type DocumentShellProps = {
  title: string;
  documentNumber: string;
  children: ReactNode;
};

export function DocumentShell({
  title,
  documentNumber,
  children,
}: DocumentShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-4xl p-4 print:p-0 sm:p-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{documentNumber}</p>
          </div>

          <PrintButton />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-emerald-500 px-8 py-8 text-white">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold">BYTECH Digital Innovation</h2>
                <p className="mt-2 text-sm text-indigo-50">
                  POS Systems · Cloud & Offline Solutions
                </p>
                <p className="mt-1 text-sm text-indigo-50">bytechng.com</p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">
                  Business Document
                </p>
                <p className="mt-2 text-lg font-semibold">{title}</p>
                <p className="mt-1 text-sm text-indigo-50">{documentNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}