"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getVisibleNavItems } from "@/components/shared/nav-items";

type MobileSidebarProps = {
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  role: "admin" | "staff";
  allowedModules: string[];
};

export function MobileSidebar({
  profileId,
  fullName,
  avatarUrl,
  role,
  allowedModules,
}: MobileSidebarProps) {
  const pathname = usePathname();

  const navItems = getVisibleNavItems({
    role,
    allowedModules,
  });

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-2xl border-white/80 bg-white/92 text-[var(--bytech-accent)] shadow-sm shadow-indigo-100"
            aria-label="Open navigation menu"
            data-tooltip="Navigation"
            data-tooltip-side="bottom"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[88vw] max-w-[360px] border-r border-indigo-100 bg-[#F1F0FC] p-2 shadow-2xl shadow-indigo-200/60"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>

          <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/92 shadow-xl shadow-indigo-100">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#111827]">
                  Navigation
                </h2>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  BYTECH CRM workspace
                </p>
              </div>

              <SheetClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-2xl border-indigo-100 bg-white text-[var(--bytech-accent)]"
                  aria-label="Close navigation menu"
                >
                  <X className="size-5" />
                </Button>
              </SheetClose>
            </div>

            <div className="border-y border-indigo-100/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--bytech-accent)] text-base font-black text-white shadow-sm shadow-indigo-200">
                  B
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-black tracking-tight text-[#111827]">
                    BYTECH <span className="text-[var(--bytech-accent)]">CRM</span>
                  </h2>
                  <p className="mt-1 truncate text-sm font-medium text-slate-500">
                    Workspace ERP
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-3 text-base font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30",
                        isActive
                          ? "bg-[var(--bytech-accent)] text-white shadow-lg shadow-indigo-200/70"
                          : "text-slate-600 hover:bg-[#F1F0FC] hover:text-[#111827]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          isActive
                            ? "bg-white/18 text-white"
                            : "bg-[#F1F0FC] text-slate-500 group-hover:bg-white group-hover:text-[var(--bytech-accent)]"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>

            <div className="p-4">
              <SheetClose asChild>
                <Link
                  href={`/users/${profileId}`}
                  className="block rounded-[1.5rem] border border-indigo-100/80 bg-gradient-to-br from-white to-[#F1F0FC] p-3 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30"
                >
                <div className="flex items-center gap-3">
                  <ProfileAvatar avatarUrl={avatarUrl} initialsText={initials(fullName)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {getFirstName(fullName)}
                    </p>
                    <p className="truncate text-xs capitalize text-slate-500">
                      {role}
                    </p>
                  </div>
                </div>
                </Link>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function MobileBottomNav({
  role,
  allowedModules,
}: Pick<MobileSidebarProps, "role" | "allowedModules">) {
  const pathname = usePathname();
  const navItems = getVisibleNavItems({ role, allowedModules });
  const preferred = ["/dashboard", "/customers", "/projects", "/tasks"];
  const bottomItems = preferred
    .map((href) => navItems.find((item) => item.href === href))
    .filter(Boolean)
    .slice(0, 4);

  if (bottomItems.length === 0) return null;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[1.75rem] border border-white/80 bg-white/94 px-3 py-2 shadow-2xl shadow-indigo-200/70 backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 items-center gap-1">
        {bottomItems.slice(0, 2).map((item) => {
          if (!item) return null;
          return <BottomNavItem key={item.href} item={item} pathname={pathname} />;
        })}

        <Link
          href="/dashboard"
            className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--bytech-accent)] text-white shadow-xl shadow-indigo-300"
            aria-label="Dashboard"
            data-tooltip="Quick action"
            data-tooltip-side="top"
          >
          <span className="text-2xl leading-none">+</span>
        </Link>

        {bottomItems.slice(2, 4).map((item) => {
          if (!item) return null;
          return <BottomNavItem key={item.href} item={item} pathname={pathname} />;
        })}

        {bottomItems.length < 4 ? (
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium text-slate-500"
          >
            <MoreHorizontal className="size-5" />
            <span>More</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function BottomNavItem({
  item,
  pathname,
}: {
  item: ReturnType<typeof getVisibleNavItems>[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      data-tooltip={item.label}
      data-tooltip-side="top"
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition",
        isActive ? "text-[var(--bytech-accent)]" : "text-slate-500"
      )}
    >
      <Icon className="size-5" />
      <span className="max-w-full truncate">{shortLabel(item.label)}</span>
    </Link>
  );
}

function shortLabel(label: string) {
  if (label === "Dashboard") return "Home";
  return label.replace("Daily ", "");
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
