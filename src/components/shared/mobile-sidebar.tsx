"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
  CheckSquare,
  ClipboardList,
  CreditCard,
  Bell,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileSidebarProps = {
  role: "admin" | "staff";
};

export function MobileSidebar({ role }: MobileSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/quotations", label: "Quotations", icon: FileText },
    { href: "/customers", label: "Customers", icon: Building2 },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/reports", label: "Daily Reports", icon: ClipboardList },
    { href: "/payments/invoices", label: "Invoices", icon: CreditCard },
    { href: "/notifications", label: "Notifications", icon: Bell },
    ...(role === "admin"
      ? [{ href: "/users", label: "Users", icon: Users }]
      : []),
  ];

  return (
    <div className="mobile-nav-trigger">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>

          <div className="border-b border-slate-200 px-6 py-6">
            <h2 className="text-xl font-bold text-slate-900">BYTECH CRM</h2>
            <p className="text-sm text-slate-500">Digital Innovation</p>
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
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}