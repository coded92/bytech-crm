import { LogoutButton } from "@/components/shared/logout-button";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MobileSidebar } from "@/components/shared/mobile-sidebar";

type HeaderProps = {
  fullName: string;
  role: "admin" | "staff";
};

export async function Header({ fullName, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger (already lg:hidden inside) */}
        <MobileSidebar role={role} />

        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            {fullName} · <span className="capitalize">{role}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <LogoutButton />
      </div>
    </header>
  );
}
