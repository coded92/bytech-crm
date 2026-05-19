import Link from "next/link";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { CommandPalette } from "@/components/command/command-palette";
import { UserMenu } from "@/components/shared/user-menu";
import { Mail } from "lucide-react";

type HeaderProps = {
  profileId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  department: string | null;
  role: "admin" | "staff";
  allowedModules: string[];
  keyboardShortcutsEnabled?: boolean;
};

export async function Header({
  profileId,
  fullName,
  email,
  avatarUrl,
  department,
  role,
  allowedModules,
  keyboardShortcutsEnabled = true,
}: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200/70 bg-white/95 px-3 backdrop-blur-xl sm:px-5 lg:px-6">
      <div className="grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <MobileSidebar
              profileId={profileId}
              fullName={fullName}
              avatarUrl={avatarUrl}
              role={role}
              allowedModules={allowedModules}
            />
          </div>

          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--bytech-accent)] text-sm font-black text-white shadow-lg shadow-indigo-200">
              B
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-base font-black tracking-tight text-[#111827]">
                BYTECH <span className="text-[var(--bytech-accent)]">CRM</span>
              </span>
              <span className="block truncate text-[11px] font-semibold text-slate-500">
                Workspace ERP
              </span>
            </span>
          </Link>
        </div>

        <div className="min-w-0 justify-self-center w-full max-w-[560px]">
          <CommandPalette
            role={role}
            allowedModules={allowedModules}
            keyboardShortcutsEnabled={keyboardShortcutsEnabled}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 justify-self-end">
          <NotificationBell />

          <button
            type="button"
            className="hidden size-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-[#111827] shadow-sm shadow-indigo-100 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F46E5]/30 sm:inline-flex"
            aria-label="Messages"
            data-tooltip="Messages"
            data-tooltip-side="bottom"
          >
            <Mail className="size-4" />
          </button>

          <UserMenu
            profileId={profileId}
            fullName={fullName}
            email={email}
            avatarUrl={avatarUrl}
            department={department}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}
