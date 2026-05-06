"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "@/components/shared/nav-items";

type SidebarProps = {
  role: "admin" | "staff";
  allowedModules: string[];
  closeSidebar?: () => void;
};

export function Sidebar({
  role,
  allowedModules,
  closeSidebar,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = getVisibleNavItems({
    role,
    allowedModules,
  });

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
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

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