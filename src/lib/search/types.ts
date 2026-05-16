import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type SearchModule =
  | "customers"
  | "leads"
  | "quotations"
  | "payments"
  | "projects"
  | "support"
  | "field_jobs"
  | "suppliers"
  | "users"
  | "reports";

export type SearchProfileAccess = {
  role: "admin" | "staff";
  allowedModules: string[];
};

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
};

export type SearchGroup = {
  id: SearchModule;
  label: string;
  results: SearchResult[];
};

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  module: SearchModule;
  adminOnly?: boolean;
  keywords: string[];
  icon?: ComponentType<LucideProps>;
};
