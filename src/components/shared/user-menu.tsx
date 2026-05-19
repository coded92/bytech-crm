"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  ChevronDown,
  HelpCircle,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  profileId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  department: string | null;
  role: "admin" | "staff";
};

export function UserMenu({
  profileId,
  fullName,
  email,
  avatarUrl,
  department,
  role,
}: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const isAdmin = role === "admin";
  const firstName = getFirstName(fullName);

  async function handleLogout() {
    startTransition(async () => {
      await signOutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-2xl border border-white bg-white px-2.5 shadow-sm shadow-indigo-100 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30"
          aria-label="Open user menu"
          data-tooltip="Account menu"
          data-tooltip-side="bottom"
        >
          <Avatar
            avatarUrl={avatarUrl}
            initialsText={initials(fullName)}
            size="sm"
          />
          <span className="hidden min-w-0 pr-1 text-left md:block">
            <span className="block max-w-24 truncate text-sm font-semibold leading-4 text-[#111827]">
              {firstName}
            </span>
            <span className="block text-xs capitalize leading-4 text-slate-500">
              {role}
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-slate-400 md:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="relative w-[min(274px,calc(100vw-24px))] overflow-visible rounded-[1.35rem] border border-slate-200 bg-white p-0 text-[#111827] shadow-2xl shadow-slate-900/12"
      >
        <span className="absolute -top-2 right-8 size-4 rotate-45 border-l border-t border-slate-200 bg-white" />

        <DropdownMenuLabel className="rounded-t-[1.35rem] bg-white px-3.5 py-2.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                avatarUrl={avatarUrl}
                initialsText={initials(fullName)}
                size="md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">
                {firstName}
              </p>
              <p className="text-xs capitalize text-slate-500">{role}</p>
              {email ? (
                <p className="mt-0.5 truncate text-[11px] font-normal text-slate-400">
                  {email}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="mx-0 bg-slate-100" />

        <div className="bg-white p-1">
          <MenuLink href={`/users/${profileId}`} icon={<UserRound />} label="My Profile" active />
          <MenuLink href={`/users/${profileId}/edit`} icon={<Settings />} label="Account Settings" />
          <MenuLink href={`/users/${profileId}/edit`} icon={<SlidersHorizontal />} label="Preferences" />
        </div>

        <DropdownMenuSeparator className="mx-3 bg-slate-100" />

        <div className="bg-white p-1">
          <MenuLink
            href="/team-management"
            icon={<UsersRound />}
            label="Team Management"
            disabled={!isAdmin}
          />
          <MenuLink
            href="/team-management?tab=permissions"
            icon={<ShieldCheck />}
            label="Role & Permissions"
            disabled={!isAdmin}
          />
        </div>

        <DropdownMenuSeparator className="mx-3 bg-slate-100" />

        <div className="bg-white p-1">
          <MenuLink href="/support" icon={<HelpCircle />} label="Help & Support" />
          <MenuLink href="/dashboard" icon={<Sparkles />} label="What's New" />
          {department ? (
            <p className="px-3 pb-1 pt-1 text-[11px] capitalize text-slate-400">
              {department.replaceAll("_", " ")}
            </p>
          ) : null}
        </div>

        <DropdownMenuSeparator className="mx-0 bg-slate-100" />

        <div className="rounded-b-[1.35rem] bg-white p-1">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleLogout();
            }}
            disabled={isPending}
            variant="destructive"
            className="min-h-[34px] rounded-xl px-3 py-1.5 font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuLink({
  href,
  icon,
  label,
  active = false,
  disabled = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex min-h-[34px] cursor-not-allowed items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-300">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
    );
  }

  return (
    <DropdownMenuItem asChild className="rounded-xl p-0">
      <Link
        href={href}
        className={`flex min-h-[34px] items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
          active
            ? "bg-indigo-50 text-[var(--bytech-accent)]"
            : "text-slate-700 hover:bg-indigo-50 hover:text-[var(--bytech-accent)]"
        }`}
      >
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

function Avatar({
  avatarUrl,
  initialsText,
  size,
}: {
  avatarUrl: string | null;
  initialsText: string;
  size: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "size-12 text-sm" : "size-8 text-xs";

  return (
    <span
      data-preference-avatar
      className={`relative flex shrink-0 overflow-hidden rounded-2xl bg-slate-950 font-bold uppercase text-white ${sizeClass}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          {initialsText}
        </span>
      )}
    </span>
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "User";
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
