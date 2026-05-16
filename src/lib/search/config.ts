import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  FolderKanban,
  Headset,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { QuickAction, SearchModule, SearchProfileAccess } from "./types";

export const searchGroups: Array<{ id: SearchModule; label: string }> = [
  { id: "customers", label: "Customers" },
  { id: "leads", label: "Leads" },
  { id: "quotations", label: "Quotations" },
  { id: "payments", label: "Invoices" },
  { id: "projects", label: "Projects" },
  { id: "support", label: "Support Tickets" },
  { id: "field_jobs", label: "Field Jobs" },
  { id: "suppliers", label: "Suppliers" },
  { id: "users", label: "Users" },
];

export const quickActions: QuickAction[] = [
  {
    id: "create-customer",
    label: "Create customer",
    description: "Add a new customer account",
    href: "/customers/new",
    module: "customers",
    keywords: ["customer", "client", "account"],
    icon: Building2,
  },
  {
    id: "create-quotation",
    label: "Create quotation",
    description: "Prepare a customer quotation",
    href: "/quotations/new",
    module: "quotations",
    keywords: ["quote", "quotation", "proposal"],
    icon: FileText,
  },
  {
    id: "create-invoice",
    label: "Create invoice",
    description: "Create a setup, subscription, or custom invoice",
    href: "/payments/invoices/new",
    module: "payments",
    adminOnly: true,
    keywords: ["invoice", "payment", "billing"],
    icon: CreditCard,
  },
  {
    id: "create-project",
    label: "Create project",
    description: "Start a new delivery project",
    href: "/projects/new",
    module: "projects",
    keywords: ["project", "delivery", "implementation"],
    icon: FolderKanban,
  },
  {
    id: "create-field-job",
    label: "Create field job",
    description: "Schedule an engineer site visit",
    href: "/field-jobs/new",
    module: "field_jobs",
    keywords: ["field", "job", "engineer", "site"],
    icon: Wrench,
  },
  {
    id: "submit-report",
    label: "Submit report",
    description: "Send a daily activity report",
    href: "/reports/new",
    module: "reports",
    keywords: ["report", "daily", "submit"],
    icon: ClipboardList,
  },
];

const moduleAliases: Partial<Record<SearchModule, string[]>> = {
  payments: ["payments", "invoices"],
  field_jobs: ["field_jobs", "field-jobs"],
};

export function canAccessModule(
  module: SearchModule,
  { role, allowedModules }: SearchProfileAccess
) {
  if (role === "admin") return true;

  const acceptedNames = moduleAliases[module] || [module];
  return acceptedNames.some((name) => allowedModules.includes(name));
}

export function getVisibleQuickActions(access: SearchProfileAccess) {
  return quickActions.filter((action) => {
    if (action.adminOnly && access.role !== "admin") return false;
    return canAccessModule(action.module, access);
  });
}

export const searchIconMap = {
  customers: Building2,
  leads: Users,
  quotations: FileText,
  payments: CreditCard,
  projects: BriefcaseBusiness,
  support: Headset,
  field_jobs: Wrench,
  suppliers: Truck,
  users: Users,
  reports: ClipboardList,
};
