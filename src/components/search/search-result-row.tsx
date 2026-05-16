"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SearchResultRowProps = {
  title: string;
  subtitle: string;
  badge?: string;
  icon?: ComponentType<LucideProps>;
  active?: boolean;
  onSelect: () => void;
};

export function SearchResultRow({
  title,
  subtitle,
  badge,
  icon: Icon,
  active,
  onSelect,
}: SearchResultRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active ? "bg-slate-900 text-white" : "hover:bg-slate-100"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          active
            ? "border-white/15 bg-white/10 text-white"
            : "border-slate-200 bg-white text-slate-500"
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span
          className={cn(
            "mt-0.5 block truncate text-xs",
            active ? "text-white/70" : "text-slate-500"
          )}
        >
          {subtitle}
        </span>
      </span>

      {badge ? (
        <Badge
          variant={active ? "secondary" : "outline"}
          className={cn("capitalize", active ? "border-white/10 bg-white/10 text-white" : "")}
        >
          {badge.replaceAll("_", " ")}
        </Badge>
      ) : null}
    </button>
  );
}
