"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.back()}
      className="gap-2 print:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}