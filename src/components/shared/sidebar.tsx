"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "@/components/shared/nav-items";

type SidebarProps = {
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  role: "admin" | "staff";
  allowedModules: string[];
  closeSidebar?: () => void;
};

export function Sidebar({
  profileId,
  fullName,
  avatarUrl,
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
    <aside className="group/sidebar h-full w-[76px] shrink-0 border-r border-slate-200/80 bg-white transition-[width] duration-300 ease-out hover:w-[236px] focus-within:w-[236px]">
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-2 pt-4">
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
                data-tooltip={item.label}
                data-tooltip-side="right"
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2.5 text-sm font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30",
                  isActive
                    ? "bg-[rgb(var(--bytech-accent-rgb)/0.1)] text-[var(--bytech-accent)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#111827]"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-[var(--bytech-accent)] text-white"
                      : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-[var(--bytech-accent)]"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                </span>

                <span className="truncate opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-3">
          <Link
            href={`/users/${profileId}`}
            className="block rounded-xl border border-slate-200/80 bg-white p-2.5 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30"
            data-tooltip="View profile"
            data-tooltip-side="right"
          >
            <div className="flex items-center gap-3">
              <ProfileAvatar avatarUrl={avatarUrl} initialsText={initials(fullName)} />
              <div className="min-w-0 flex-1 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
                <p className="truncate text-sm font-semibold text-[#111827]">
                  {getFirstName(fullName)}
                </p>
                <p className="truncate text-xs capitalize text-slate-500">
                  {role}
                </p>
              </div>
              <MoreVertical className="size-4 shrink-0 text-slate-400 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100" />
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "B";
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "User";
}

function ProfileAvatar({
  avatarUrl,
  initialsText,
}: {
  avatarUrl: string | null;
  initialsText: string;
}) {
  return (
    <div data-preference-avatar className="flex size-10 shrink-0 overflow-hidden rounded-2xl bg-slate-950 text-sm font-bold uppercase text-white">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center">
          {initialsText}
        </span>
      )}
    </div>
  );
}
