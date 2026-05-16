import { LogoutButton } from "@/components/shared/logout-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";
import { CommandPalette } from "@/components/command/command-palette";

type HeaderProps = {
  fullName: string;
  role: "admin" | "staff";
  allowedModules: string[];
};

export async function Header({
  fullName,
  role,
  allowedModules,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MobileSidebar
              role={role}
              allowedModules={allowedModules}
            />

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                Welcome back
              </h1>

              <p className="truncate text-xs text-slate-500 sm:text-sm">
                {fullName} · <span className="capitalize">{role}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>

        <CommandPalette role={role} allowedModules={allowedModules} />
      </div>
    </header>
  );
}
