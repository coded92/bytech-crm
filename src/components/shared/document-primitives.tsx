import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DocumentSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function DocumentSection({
  title,
  description,
  children,
  className,
}: DocumentSectionProps) {
  return (
    <section
      className={cn(
        "document-avoid-break border-t border-slate-200 pt-5",
        className
      )}
    >
      {title ? (
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase text-slate-950">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}

type DocumentTableProps = {
  children: ReactNode;
  className?: string;
};

export function DocumentTable({ children, className }: DocumentTableProps) {
  return (
    <div className={cn("overflow-hidden border border-slate-200", className)}>
      <table className="document-table min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

type DocumentTotalsRow = {
  label: string;
  value: ReactNode;
  strong?: boolean;
};

type DocumentTotalsProps = {
  rows: DocumentTotalsRow[];
  className?: string;
};

export function DocumentTotals({ rows, className }: DocumentTotalsProps) {
  return (
    <div
      className={cn(
        "document-avoid-break ml-auto w-full max-w-sm border border-slate-200 text-sm",
        className
      )}
    >
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className={cn(
            "flex items-center justify-between gap-6 border-b border-slate-200 px-4 py-3 last:border-b-0",
            row.strong ? "bg-slate-950 text-white" : "bg-white text-slate-700"
          )}
        >
          <span className={row.strong ? "font-semibold" : ""}>{row.label}</span>
          <span className={row.strong ? "font-semibold" : "font-medium"}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

type DocumentStatusStampProps = {
  status: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  className?: string;
};

const statusToneClass = {
  neutral: "border-slate-300 text-slate-700",
  success: "border-emerald-600 text-emerald-700",
  warning: "border-amber-600 text-amber-700",
  danger: "border-red-600 text-red-700",
};

export function DocumentStatusStamp({
  status,
  tone = "neutral",
  className,
}: DocumentStatusStampProps) {
  return (
    <div
      className={cn(
        "inline-flex border px-4 py-2 text-xs font-semibold uppercase",
        statusToneClass[tone],
        className
      )}
    >
      {status}
    </div>
  );
}

type DocumentSignatureBlockProps = {
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
};

export function DocumentSignatureBlock({
  leftLabel = "Authorized Signature",
  rightLabel = "Customer Signature",
  className,
}: DocumentSignatureBlockProps) {
  return (
    <div
      className={cn(
        "document-avoid-break grid gap-8 pt-10 sm:grid-cols-2 print:grid-cols-2",
        className
      )}
    >
      {[leftLabel, rightLabel].map((label) => (
        <div key={label}>
          <div className="h-12 border-b border-slate-400" />
          <p className="mt-2 text-xs font-medium uppercase text-slate-500">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

type PaymentInstructionsBlockProps = {
  title?: string;
  instructions?: ReactNode;
  reference?: ReactNode;
  className?: string;
};

export function PaymentInstructionsBlock({
  title = "Payment Instructions",
  instructions,
  reference,
  className,
}: PaymentInstructionsBlockProps) {
  if (!instructions && !reference) {
    return null;
  }

  return (
    <DocumentSection title={title} className={className}>
      <div className="space-y-3 border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {instructions ? <div>{instructions}</div> : null}
        {reference ? (
          <div>
            <span className="font-semibold text-slate-950">Reference: </span>
            {reference}
          </div>
        ) : null}
      </div>
    </DocumentSection>
  );
}
