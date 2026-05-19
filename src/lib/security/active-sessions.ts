import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const BYTECH_SESSION_COOKIE = "bytech_session_id";

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type ActiveSessionStatus = "active" | "signed_out" | "expired" | "revoked";

async function getRequestContext(): Promise<RequestContext> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;

  return {
    ipAddress,
    userAgent: headerStore.get("user-agent"),
  };
}

function hashSessionIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 48);
}

function inferDeviceType(userAgent: string | null) {
  if (!userAgent) return null;
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function inferBrowser(userAgent: string | null) {
  if (!userAgent) return null;
  if (/edg/i.test(userAgent)) return "Edge";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Unknown";
}

function inferOs(userAgent: string | null) {
  if (!userAgent) return null;
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

async function getBrowserSessionIdentifier({ create }: { create: boolean }) {
  const cookieStore = await cookies();
  const existing = cookieStore.get(BYTECH_SESSION_COOKIE)?.value;

  if (existing) return existing;
  if (!create) return null;

  const value = randomUUID();

  try {
    cookieStore.set(BYTECH_SESSION_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  } catch {
    // Server Components cannot mutate cookies. Server Actions can.
  }

  return value;
}

export async function getCurrentSessionHash({ create = false } = {}) {
  const rawSessionIdentifier = await getBrowserSessionIdentifier({ create });
  return rawSessionIdentifier ? hashSessionIdentifier(rawSessionIdentifier) : null;
}

export async function clearBrowserSessionIdentifier() {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(BYTECH_SESSION_COOKIE);
  } catch {
    // Deleting cookies is only available in mutation-capable server contexts.
  }
}

export async function touchActiveSession(args: {
  userId: string;
  location?: string | null;
}) {
  const rawSessionIdentifier = await getBrowserSessionIdentifier({ create: true });
  if (!rawSessionIdentifier) {
    return { sessionIdentifier: null };
  }

  const sessionIdentifier = hashSessionIdentifier(rawSessionIdentifier);
  const context = await getRequestContext();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await (supabase as any)
    .from("user_active_sessions")
    .upsert(
      {
        user_id: args.userId,
        session_identifier: sessionIdentifier,
        device_type: inferDeviceType(context.userAgent),
        browser: inferBrowser(context.userAgent),
        os: inferOs(context.userAgent),
        ip_address: context.ipAddress,
        location: args.location ?? null,
        user_agent: context.userAgent,
        status: "active",
        last_seen_at: now,
        signed_out_at: null,
        revoked_at: null,
      },
      {
        onConflict: "user_id,session_identifier",
      }
    );

  if (error) {
    console.error("Failed to touch active session", error);
  }

  return { sessionIdentifier };
}

export async function markCurrentActiveSessionSignedOut(args: {
  userId: string;
}) {
  const sessionIdentifier = await getCurrentSessionHash();

  if (!sessionIdentifier) return;

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await (supabase as any)
    .from("user_active_sessions")
    .update({
      status: "signed_out",
      signed_out_at: now,
      last_seen_at: now,
    })
    .eq("user_id", args.userId)
    .eq("session_identifier", sessionIdentifier);

  if (error) {
    console.error("Failed to mark active session signed out", error);
  }

  await clearBrowserSessionIdentifier();
}

export async function markActiveSessionRevoked(args: {
  userId: string;
  activeSessionId: string;
}) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await (supabase as any)
    .from("user_active_sessions")
    .update({
      status: "revoked",
      revoked_at: now,
      last_seen_at: now,
    })
    .eq("id", args.activeSessionId)
    .eq("user_id", args.userId);

  if (error) {
    console.error("Failed to revoke active session", error);
    return { error: error.message };
  }

  return { success: true as const };
}
