import { LogoutButton } from "@/components/shared/logout-button";
import { NotificationBell } from "@/components/shared/notification-bell";

type HeaderProps = {
  fullName: string;
  role: "admin" | "staff";
};

export async function Header({ fullName, role }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">
          {fullName} · <span className="capitalize">{role}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <LogoutButton />
      </div>
    </header>
  );
}