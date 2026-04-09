"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ExportCsvButtonProps = {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  label?: string;
};

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function ExportCsvButton({
  filename,
  headers,
  rows,
  label = "Export CSV",
}: ExportCsvButtonProps) {
  function handleExport() {
    const csvLines = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}