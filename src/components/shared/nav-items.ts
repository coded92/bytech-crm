import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileText,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Bell,
  FolderKanban,
  Wallet,
  Headset,
  MonitorSmartphone,
  Package,
  Settings,
  ShieldCheck,
  Wrench,
  Boxes,
  Truck,
  ShoppingCart,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/leads", label: "Leads", icon: Users, module: "leads" },
  { href: "/quotations", label: "Quotations", icon: FileText, module: "quotations" },
  { href: "/customers", label: "Customers", icon: Building2, module: "customers" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, module: "tasks" },
  { href: "/projects", label: "Projects", icon: FolderKanban, module: "projects" },
  { href: "/reports", label: "Daily Reports", icon: ClipboardList, module: "reports" },
  { href: "/payments/invoices", label: "Invoices", icon: CreditCard, module: "payments" },
  { href: "/expenses", label: "Expenses", icon: Wallet, module: "expenses" },
  { href: "/notifications", label: "Notifications", icon: Bell, module: "notifications" },
  { href: "/deployments", label: "Deployments", icon: MonitorSmartphone, module: "deployments" },
  { href: "/assets", label: "Assets", icon: Package, module: "assets" },
  { href: "/field-jobs", label: "Field Jobs", icon: Wrench, module: "field_jobs" },
  { href: "/field-jobs/daily-report", label: "Engineer Daily", icon: Wrench, module: "engineer_daily" },
  { href: "/inventory", label: "Inventory", icon: Boxes, module: "inventory" },
  { href: "/support", label: "Support", icon: Headset, module: "support" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, module: "suppliers" },
  { href: "/restocking", label: "Restocking", icon: ShoppingCart, module: "restocking" },
  { href: "/suppliers/payables", label: "Supplier Payables", icon: Truck, module: "supplier_payables" },
  { href: "/team-management", label: "Team Management", icon: UsersRound, module: "users", adminOnly: true },
  { href: "/settings/company", label: "Settings", icon: Settings, module: "settings", adminOnly: true },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, module: "audit_logs", adminOnly: true },
];

export function getVisibleNavItems({
  role,
  allowedModules,
}: {
  role: "admin" | "staff";
  allowedModules: string[];
}) {
  if (role === "admin") return navItems;

  return navItems.filter((item) => {
    if (item.adminOnly) return false;
    return allowedModules.includes(item.module);
  });
}
