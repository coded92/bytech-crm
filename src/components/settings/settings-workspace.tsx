import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CircleHelp,
  Database,
  FileText,
  FileClock,
  Landmark,
  LockKeyhole,
  MonitorSmartphone,
  Palette,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsNavKey =
  | "general"
  | "profile"
  | "preferences"
  | "notifications"
  | "security"
  | "sessions"
  | "documents-branding"
  | "connected"
  | "billing"
  | "appearance"
  | "team"
  | "roles"
  | "audit"
  | "privacy"
  | "help"
  | "whats-new";

const settingsNavItems: Array<{
  key: SettingsNavKey;
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  group: "account" | "workspace" | "governance" | "support";
}> = [
  {
    key: "general",
    label: "General",
    href: "/settings/company",
    icon: CalendarDays,
    group: "account",
  },
  {
    key: "security",
    label: "Security",
    href: "/settings/security",
    icon: ShieldCheck,
    group: "account",
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    group: "account",
  },
  {
    key: "sessions",
    label: "Sessions",
    href: "/settings/sessions",
    icon: MonitorSmartphone,
    group: "account",
  },
  {
    key: "documents-branding",
    label: "Documents & Branding",
    href: "/settings/documents-branding",
    icon: FileText,
    adminOnly: true,
    group: "account",
  },
  {
    key: "connected",
    label: "Connected Apps",
    icon: SlidersHorizontal,
    group: "account",
  },
  {
    key: "billing",
    label: "Billing",
    icon: Landmark,
    adminOnly: true,
    group: "account",
  },
  {
    key: "preferences",
    label: "Preferences",
    href: "/settings/preferences",
    icon: SlidersHorizontal,
    group: "workspace",
  },
  {
    key: "appearance",
    label: "Appearance",
    icon: Palette,
    group: "workspace",
  },
  {
    key: "team",
    label: "Team Management",
    href: "/settings/team-management",
    icon: UsersRound,
    adminOnly: true,
    group: "workspace",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/settings/roles",
    icon: LockKeyhole,
    adminOnly: true,
    group: "workspace",
  },
  {
    key: "audit",
    label: "Audit Logs",
    href: "/settings/audit-logs",
    icon: FileClock,
    adminOnly: true,
    group: "governance",
  },
  {
    key: "privacy",
    label: "Data & Privacy",
    href: "/settings/data-privacy",
    icon: Database,
    group: "governance",
  },
  {
    key: "help",
    label: "Help & Support",
    icon: CircleHelp,
    group: "support",
  },
  {
    key: "whats-new",
    label: "What's New",
    icon: Sparkles,
    group: "support",
  },
];

const settingsNavGroups: Array<{
  key: (typeof settingsNavItems)[number]["group"];
  withDivider?: boolean;
}> = [
  { key: "account" },
  { key: "workspace", withDivider: true },
  { key: "governance", withDivider: true },
  { key: "support", withDivider: true },
];

export function SettingsWorkspace({
  active,
  title,
  description,
  eyebrow = "Settings",
  isAdmin,
  children,
  rightRail,
  headerAction,
}: {
  active: SettingsNavKey;
  title: string;
  description: string;
  eyebrow?: string;
  isAdmin: boolean;
  children: React.ReactNode;
  rightRail?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const visibleNav = settingsNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-w-0">
      <section className="border-b border-slate-200/80 bg-white">
        <div
          className={cn(
            "grid min-w-0 gap-0 xl:items-start",
            rightRail
              ? "xl:grid-cols-[244px_minmax(0,1fr)_318px]"
              : "xl:grid-cols-[244px_minmax(0,1fr)]"
          )}
        >
          <aside className="border-b border-slate-200/80 bg-white px-3 py-5 sm:px-4 xl:sticky xl:top-0 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
            <h2 className="px-2 text-[1.05rem] font-black tracking-tight text-[#111827]">
              Account Settings
            </h2>
            <nav className="mt-5 space-y-1">
              {settingsNavGroups.map((group) => {
                const items = visibleNav.filter((item) => item.group === group.key);
                if (items.length === 0) return null;

                return (
                  <div
                    key={group.key}
                    className={cn(group.withDivider && "border-t border-slate-200/80 pt-4 mt-4")}
                  >
                    <div className="space-y-1">
                      {items.map((item) => (
                        <SettingsNavItem
                          key={item.key}
                          item={item}
                          selected={item.key === active}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 bg-white px-4 py-5 sm:px-5 lg:px-6">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F1ECFF] text-[#4F46E5]">
                  <Settings className="size-5" />
                </span>
                <div className="min-w-0">
                  {eyebrow ? (
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4F46E5]">
                      {eyebrow}
                    </p>
                  ) : null}
                  <h1 className={cn("text-2xl font-black tracking-tight text-[#111827]", eyebrow && "mt-1")}>
                    {title}
                  </h1>
                  <p className="mt-1 max-w-2xl text-[13px] font-medium leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
              {headerAction ?? (
                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-[var(--bytech-accent)] shadow-sm">
                  <ShieldCheck className="size-4" />
                  Backend-backed
                </span>
              )}
            </div>
            {children}
          </main>

          {rightRail ? (
            <aside className="border-t border-slate-200/80 bg-white p-4 sm:p-5 xl:sticky xl:top-0 xl:max-h-[calc(100vh-4rem)] xl:overflow-y-auto xl:border-l xl:border-t-0">
              <div className="space-y-4">{rightRail}</div>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SettingsNavItem({
  item,
  selected,
}: {
  item: (typeof settingsNavItems)[number];
  selected: boolean;
}) {
  const Icon = item.icon;
  const className = cn(
    "group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition",
    selected
      ? "bg-[var(--bytech-accent)] text-white shadow-lg shadow-indigo-200/80"
      : item.href
        ? "text-[#111827] hover:bg-[#F1F0FC] hover:text-[var(--bytech-accent)]"
        : "cursor-not-allowed text-slate-400"
  );

  const content = (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0",
          selected
            ? "text-white"
            : item.href
              ? "text-slate-700 group-hover:text-[var(--bytech-accent)]"
              : "text-slate-400"
        )}
      />
      <span className="truncate">{item.label}</span>
    </>
  );

  if (!item.href) {
    return (
      <button type="button" className={className} disabled aria-disabled="true">
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-indigo-100/70 bg-white p-4 shadow-sm shadow-indigo-100/60 sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#111827]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsRailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-indigo-100/70 bg-white p-4 shadow-sm shadow-indigo-100/60">
      <h3 className="text-sm font-bold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function SettingsMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "bg-indigo-50 text-[var(--bytech-accent)]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-indigo-100/70 bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn("mt-2 w-fit rounded-xl px-2 py-1 text-lg font-black", toneClass)}>
        {value}
      </p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "bg-indigo-50 text-[var(--bytech-accent)]",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", toneClass)}>
      {children}
    </span>
  );
}
