"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Laptop,
  LockKeyhole,
  ShieldCheck,
  ShieldQuestion,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type Overview = {
  security_score: string;
  active_session_count: number;
  two_factor_status: string;
  unused_backup_code_count: number;
  unrecognized_device_count: number;
};

type ActiveSession = {
  id: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  status: string;
  trusted_status?: string | null;
  last_seen_at: string;
};

type SecurityEvent = {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export function SecurityOverviewButton({
  overview,
  activeSessions,
  securityEvents,
  className,
  compact = false,
}: {
  overview: Overview;
  activeSessions: ActiveSession[];
  securityEvents: SecurityEvent[];
  className?: string;
  compact?: boolean;
}) {
  const activeSessionCount = activeSessions.filter(
    (session) => session.status === "active"
  ).length;
  const hasDeviceRisk = overview.unrecognized_device_count > 0;
  const has2fa = overview.two_factor_status === "enabled";
  const scoreLabel =
    overview.security_score === "excellent" && has2fa && !hasDeviceRisk
      ? "Excellent"
      : hasDeviceRisk
        ? "Review"
        : "Strong";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={compact ? "default" : "outline"}
          className={cn(
            !compact &&
              "border-[var(--bytech-accent)] text-[var(--bytech-accent)] hover:bg-[#F7F5FF]",
            className
          )}
        >
          <ShieldCheck className="size-4" />
          Security Overview
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="!bottom-4 !left-auto !right-4 !top-20 !max-h-[calc(100vh-6rem)] !w-[min(760px,calc(100vw-2rem))] !max-w-none !translate-x-0 !translate-y-0 overflow-y-auto rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-200/50"
      >
        <DialogHeader className="relative flex-row items-start gap-4 pr-12">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1ECFF] text-[var(--bytech-accent)]">
            <ShieldCheck className="size-6" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-xl font-black tracking-tight text-[#111827]">
              Security Overview
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm font-medium leading-6 text-slate-500">
              An overview of your account security status and activity.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-0 top-0 flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="Close security overview"
            >
              <X className="size-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewMetric
            icon={<ShieldCheck />}
            label="Security Score"
            value={scoreLabel}
            detail="Last updated now"
            tone={scoreLabel === "Review" ? "warning" : "success"}
          />
          <OverviewMetric
            icon={<LockKeyhole />}
            label="Account Security"
            value={hasDeviceRisk ? "Review" : "Strong"}
            detail={hasDeviceRisk ? "Device review needed" : "No critical issues found"}
            tone={hasDeviceRisk ? "warning" : "purple"}
          />
          <OverviewMetric
            icon={<Laptop />}
            label="Active Sessions"
            value={String(activeSessionCount)}
            detail={`${activeSessionCount === 1 ? "Across 1 device" : `Across ${activeSessionCount} devices`}`}
            tone="blue"
          />
          <OverviewMetric
            icon={<ShieldQuestion />}
            label="2FA Status"
            value={has2fa ? "Enabled" : "Not set"}
            detail={has2fa ? "Authenticator app" : "MFA setup pending"}
            tone={has2fa ? "orange" : "warning"}
          />
        </div>

        <section className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-[#111827]">
              Recent Security Activity
            </h3>
            <span className="text-sm font-black text-[var(--bytech-accent)]">
              View All Activity
            </span>
          </div>
          <div className="divide-y divide-slate-200">
            {securityEvents.slice(0, 5).map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
            {securityEvents.length === 0 ? (
              <p className="py-4 text-sm font-semibold text-slate-500">
                No security activity has been recorded yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-[#111827]">
              Security Recommendations
            </h3>
            <span className="text-sm font-black text-[var(--bytech-accent)]">
              View All Recommendations
            </span>
          </div>
          <div className="space-y-3">
            {hasDeviceRisk ? (
              <Recommendation
                tone="warning"
                title="Review unfamiliar devices"
                detail={`${overview.unrecognized_device_count} active device needs trusted-device review.`}
              />
            ) : (
              <Recommendation
                tone="success"
                title="Looks good! No critical recommendations at this time."
                detail="We'll continue to monitor your account and notify you of important updates."
              />
            )}
            {!has2fa ? (
              <Recommendation
                tone="info"
                title="Finish Supabase MFA integration"
                detail="2FA metadata is ready, but authenticator enrollment must be wired before users can enable it."
              />
            ) : null}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function OverviewMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "success" | "purple" | "blue" | "orange" | "warning";
}) {
  const color = {
    success: "bg-emerald-50 text-emerald-700",
    purple: "bg-[#F1ECFF] text-[var(--bytech-accent)]",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    warning: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4 text-center">
      <span className={cn("mx-auto flex size-14 items-center justify-center rounded-2xl", color)}>
        {icon}
      </span>
      <p className="mt-4 text-sm font-bold text-[#111827]">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-black",
          tone === "success"
            ? "text-emerald-700"
            : tone === "orange"
              ? "text-orange-600"
              : tone === "warning"
                ? "text-amber-700"
                : "text-[var(--bytech-accent)]"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
    </div>
  );
}

function ActivityRow({ event }: { event: SecurityEvent }) {
  const risky =
    event.event_type.includes("unusual") ||
    event.event_type.includes("blocked");
  const Icon = risky ? AlertTriangle : CheckCircle2;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            risky ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111827]">
            {formatLabel(event.event_type)}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-500">
            {[event.ip_address, event.user_agent].filter(Boolean).join(" · ") ||
              "Context unavailable"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-slate-500">
        {formatRelativeTime(event.created_at)}
      </span>
    </div>
  );
}

function Recommendation({
  tone,
  title,
  detail,
}: {
  tone: "success" | "warning" | "info";
  title: string;
  detail: string;
}) {
  const Icon =
    tone === "success" ? ShieldCheck : tone === "warning" ? AlertTriangle : Info;
  const color = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    info: "bg-[#F1ECFF] text-[var(--bytech-accent)]",
  }[tone];

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 p-4">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", color)}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-black text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
          {detail}
        </p>
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
