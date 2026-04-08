type DocumentInfoRowProps = {
  label: string;
  value?: string | number | null;
};

export function DocumentInfoRow({
  label,
  value,
}: DocumentInfoRowProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-900">{value ?? "-"}</p>
    </div>
  );
}