type DocumentInfoRowProps = {
  label: string;
  value?: string | number | null;
};

export function DocumentInfoRow({
  label,
  value,
}: DocumentInfoRowProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-950">
        {value ?? "-"}
      </p>
    </div>
  );
}
