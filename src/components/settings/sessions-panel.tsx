"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Laptop,
  Loader2,
  MapPin,
  MoreVertical,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Tablet,
  UserRound,
  Wifi,
} from "lucide-react";
import {
  refreshMySessionsAction,
  revokeMyActiveSessionAction,
  signOutCurrentSessionAction,
} from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type ActiveSession = {
  id: string;
  session_identifier: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  user_agent: string | null;
  status: "active" | "signed_out" | "expired" | "revoked";
  first_seen_at: string;
  last_seen_at: string;
  signed_out_at: string | null;
  revoked_at: string | null;
};

type SessionEvent = {
  id: string;
  session_identifier: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  event_type: "login" | "logout" | "refresh";
  last_seen_at: string;
  created_at: string;
};

export function SessionsPanel({
  activeSessions,
  sessionEvents,
  currentSessionIdentifier,
  error,
  securityOverviewTrigger,
}: {
  activeSessions: ActiveSession[];
  sessionEvents: SessionEvent[];
  currentSessionIdentifier: string | null;
  error?: string;
  securityOverviewTrigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isSigningOut, startSignOut] = useTransition();
  const currentSession =
    activeSessions.find(
      (session) => session.session_identifier === currentSessionIdentifier
    ) ?? activeSessions.find((session) => session.status === "active");
  const otherActiveSessions = activeSessions.filter(
    (session) =>
      session.status === "active" &&
      session.session_identifier !== currentSession?.session_identifier
  );
  const recentlySignedOut = [
    ...activeSessions.filter((session) => session.status !== "active"),
    ...sessionEvents.filter((event) => event.event_type === "logout"),
  ].slice(0, 5);

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Sessions backend is not available yet: {error}
        </div>
      ) : null}

      <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/40">
        <div className="mb-5">
          <h2 className="text-lg font-black tracking-tight text-[#111827]">
            Current Session
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            This is the device and browser you are currently using.
          </p>
        </div>
        {currentSession ? (
          <CurrentSessionCard
            session={currentSession}
            onSignOut={() => {
              startSignOut(async () => {
                await signOutCurrentSessionAction();
              });
            }}
            isSigningOut={isSigningOut}
          />
        ) : (
          <EmptyState message="No current session is registered yet. Refresh the page after applying the sessions migration." />
        )}
      </section>

      <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/40">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#111827]">
              Other Active Sessions ({otherActiveSessions.length})
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              You are currently signed in on these recorded devices.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isRefreshing}
            onClick={() => {
              startRefresh(async () => {
                await refreshMySessionsAction();
                router.refresh();
              });
            }}
            className="border-[var(--bytech-accent)] text-[var(--bytech-accent)]"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
        {otherActiveSessions.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {otherActiveSessions.map((session) => (
              <OtherSessionRow key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <EmptyState message="No other active sessions are currently recorded." />
        )}
      </section>

      <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/40">
        <div className="mb-5">
          <h2 className="text-lg font-black tracking-tight text-[#111827]">
            Recently Signed Out
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Devices and browsers that have been signed out from your account.
          </p>
        </div>
        {recentlySignedOut.length > 0 ? (
          <div className="space-y-3">
            {recentlySignedOut.map((item) => (
              <SignedOutRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState message="No signed-out sessions have been recorded yet." />
        )}
      </section>

      <section className="rounded-[1.35rem] border border-indigo-100 bg-[#F7F5FF] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7E2FF] text-[var(--bytech-accent)]">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-black text-[#111827]">Protect your account</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                If you see an unfamiliar session, revoke it and review your security settings.
              </p>
            </div>
          </div>
          {securityOverviewTrigger ?? null}
        </div>
      </section>
    </div>
  );
}

function CurrentSessionCard({
  session,
  onSignOut,
  isSigningOut,
}: {
  session: ActiveSession;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <div className="rounded-[1.25rem] bg-[#F5F2FF] p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 gap-4">
          <DeviceIcon deviceType={session.device_type} active />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-[#111827]">
                {sessionTitle(session)}
              </p>
              <span className="rounded-full border border-[var(--bytech-accent)] bg-white px-2 py-0.5 text-xs font-bold text-[var(--bytech-accent)]">
                Current
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">
              {[session.location, session.ip_address].filter(Boolean).join(" · ") || "Location unavailable"}
            </p>
            <p className="mt-5 text-sm font-medium text-slate-500">
              Last active {formatRelativeTime(session.last_seen_at)}
            </p>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
        <InfoStack
          items={[
            ["Session started", formatDateTime(session.first_seen_at)],
            ["IP Address", session.ip_address ?? "-"],
          ]}
        />
        <InfoStack
          items={[
            ["Location", session.location ?? "Unknown"],
            ["Timezone", Intl.DateTimeFormat().resolvedOptions().timeZone],
          ]}
        />
      </div>
    </div>
  );
}

function OtherSessionRow({ session }: { session: ActiveSession }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1.2fr)_0.8fr_0.8fr_0.8fr_auto_auto] lg:items-center">
      <div className="flex min-w-0 gap-4">
        <DeviceIcon deviceType={session.device_type} />
        <div className="min-w-0">
          <p className="truncate font-black text-[#111827]">{sessionTitle(session)}</p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {[session.location, session.ip_address].filter(Boolean).join(" · ") || "Location unavailable"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Active
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
              {formatRelativeTime(session.last_seen_at)}
            </span>
          </div>
        </div>
      </div>
      <MiniInfo icon={<Clock3 />} label="Last active" value={formatDateTime(session.last_seen_at)} />
      <MiniInfo icon={<UserRound />} label="IP Address" value={session.ip_address ?? "-"} />
      <MiniInfo icon={<MapPin />} label="Location" value={session.location ?? "Unknown"} />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await revokeMyActiveSessionAction(session.id);
            router.refresh();
          });
        }}
        className="h-9 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "Signing out..." : "Sign Out"}
      </button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
        aria-label="More session actions"
      >
        <MoreVertical className="size-4" />
      </button>
    </div>
  );
}

function SignedOutRow({ item }: { item: ActiveSession | SessionEvent }) {
  const isActiveSession = "status" in item;
  const signedOutAt = isActiveSession
    ? item.signed_out_at ?? item.revoked_at ?? item.last_seen_at
    : item.created_at;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 px-4 py-3 md:grid-cols-[minmax(0,1.3fr)_0.8fr_0.8fr_0.8fr] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <DeviceIcon deviceType={item.device_type} compact />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#111827]">{sessionTitle(item)}</p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {[item.location, item.ip_address].filter(Boolean).join(" · ") || "Location unavailable"}
          </p>
        </div>
      </div>
      <MiniInfo icon={<RefreshCcw />} label="Signed out" value={formatDateTime(signedOutAt)} />
      <MiniInfo icon={<UserRound />} label="IP Address" value={item.ip_address ?? "-"} />
      <MiniInfo icon={<UserRound />} label="Signed out by" value="You" />
    </div>
  );
}

function DeviceIcon({
  deviceType,
  active = false,
  compact = false,
}: {
  deviceType: string | null;
  active?: boolean;
  compact?: boolean;
}) {
  const Icon =
    deviceType === "mobile"
      ? Smartphone
      : deviceType === "tablet"
        ? Tablet
        : Laptop;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl",
        compact ? "size-10" : "size-14",
        active ? "bg-[#E7E2FF] text-[var(--bytech-accent)]" : "bg-indigo-50 text-indigo-500"
      )}
    >
      <Icon className={compact ? "size-4" : "size-6"} />
      {active ? (
        <span className="absolute bottom-2 right-2 size-2.5 rounded-full border border-white bg-emerald-500" />
      ) : null}
    </span>
  );
}

function InfoStack({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="space-y-5">
      {items.map(([label, value]) => (
        <MiniInfo key={label} icon={label.includes("IP") ? <ShieldCheck /> : <Clock3 />} label={label} value={value} />
      ))}
    </div>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 text-slate-500 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#111827]">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}

function sessionTitle(session: {
  browser: string | null;
  os: string | null;
  device_type: string | null;
}) {
  const browser = session.browser && session.browser !== "Unknown" ? session.browser : "Browser";
  const os = session.os && session.os !== "Unknown" ? session.os : deviceLabel(session.device_type);
  return `${browser} on ${os}`;
}

function deviceLabel(deviceType: string | null) {
  if (deviceType === "mobile") return "Mobile";
  if (deviceType === "tablet") return "Tablet";
  return "Desktop";
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
