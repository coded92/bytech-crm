"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="gap-2 bg-slate-950 text-white hover:bg-slate-800 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Print / Save PDF
    </Button>
  );
}
