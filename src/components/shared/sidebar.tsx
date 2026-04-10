"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";
import { Headset } from "lucide-react";
import { MonitorSmartphone } from "lucide-react";
import { Package } from "lucide-react";
import { Settings } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Wrench } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Bell,
} from "lucide-react";

type SidebarProps = {
  role: "admin" | "staff";
  closeSidebar?: () => void;
};

export function Sidebar({ role, closeSidebar }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/customers", label: "Customers", icon: Building2 },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/reports", label: "Daily Reports", icon: ClipboardList },
    { href: "/payments/invoices", label: "Invoices", icon: CreditCard },
    { href: "/expenses", label: "Expenses", icon: Wallet },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/deployments", label: "Deployments", icon: MonitorSmartphone },
    { href: "/assets", label: "Assets", icon: Package },
    { href: "/field-jobs", label: "Field Jobs", icon: Wrench },
    { href: "/support", label: "Support", icon: Headset },
    ...(role === "admin"
      ? [
          { href: "/users", label: "Users", icon: Users },
          { href: "/settings/company", label: "Settings", icon: Settings },
          { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <aside className="h-full w-72 shrink-0 border-r border-slate-200 bg-white sm:h-screen sm:w-64">
      <div className="border-b border-slate-200 px-4 py-5">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 p-[1px]">
          <div className="rounded-2xl bg-white px-4 py-4">
            <h2 className="text-lg font-bold text-slate-900">BYTECH CRM</h2>
            <p className="text-xs text-slate-500">Digital Innovation</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-900"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}