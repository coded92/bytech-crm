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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { Headset } from "lucide-react";
import { MonitorSmartphone } from "lucide-react";
import { Package } from "lucide-react";
import { Settings } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Wrench } from "lucide-react";
import { Boxes } from "lucide-react";
import { Truck, ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetClose,
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
    { href: "/expenses", label: "Expenses", icon: Wallet },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/deployments", label: "Deployments", icon: MonitorSmartphone },
    { href: "/assets", label: "Assets", icon: Package },
    { href: "/field-jobs", label: "Field Jobs", icon: Wrench },
    { href: "/field-jobs/daily-report", label: "Engineer Daily", icon: Wrench },
    { href: "/inventory", label: "Inventory", icon: Boxes },
    { href: "/support", label: "Support", icon: Headset },
    { href: "/suppliers", label: "Suppliers", icon: Truck },
    { href: "/restocking", label: "Restocking", icon: ShoppingCart },
    { href: "/suppliers/payables", label: "Supplier Payables", icon: Truck },
    ...(role === "admin"
      ? [
          { href: "/users", label: "Users", icon: Users },
          { href: "/settings/company", label: "Settings", icon: Settings },
          { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
        ]
      : []),
  ];

  return (
    <div className="lg:hidden">  {/* FIXED HERE */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200 bg-white shadow-sm"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[85vw] max-w-[320px] border-r border-slate-200 bg-white p-0 shadow-2xl"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>

          <div className="flex h-full flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <h2 className="text-2xl font-bold text-slate-900">Menu</h2>

              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-slate-200 bg-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            <div className="border-b border-slate-200 px-5 py-5">
              <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-emerald-500 p-[1px]">
                <div className="rounded-3xl bg-white px-5 py-5">
                  <h2 className="text-2xl font-bold text-slate-900">
                    BYTECH CRM
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Digital Innovation
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto bg-white px-4 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-medium transition-all",
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
