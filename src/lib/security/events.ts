import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type SecurityEventType =
  | "login"
  | "logout"
  | "password_reset"
  | "password_changed"
  | "profile_updated"
  | "avatar_updated"
  | "preferences_updated"
  | "notification_preferences_updated"
  | "general_settings_updated"
  | "company_settings_updated"
  | "security_settings_updated"
  | "security_questions_updated"
  | "recovery_contact_updated"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "backup_codes_generated"
  | "trusted_device_updated"
  | "login_alert_sent"
  | "unusual_signin_detected"
  | "document_branding_settings_updated"
  | "role_created"
  | "role_updated"
  | "role_deactivated"
  | "role_permission_updated"
  | "permission_set_created"
  | "permission_set_updated"
  | "team_created"
  | "team_updated"
  | "team_member_updated"
  | "invitation_created"
  | "invitation_updated"
  | "team_management_settings_updated";

export type SessionEventType = "login" | "logout" | "refresh";

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

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

export async function logSecurityEvent(args: {
  userId: string;
  eventType: SecurityEventType;
  metadata?: Json;
}) {
  const supabase = await createClient();
  const context = await getRequestContext();

  const { error } = await (supabase as any).from("user_security_events").insert({
    user_id: args.userId,
    event_type: args.eventType,
    ip_address: context.ipAddress,
    user_agent: context.userAgent,
    metadata: args.metadata ?? null,
  });

  if (error) {
    console.error("Failed to write user security event", error);
  }
}

export async function logSessionEvent(args: {
  userId: string;
  eventType: SessionEventType;
  sessionIdentifier?: string | null;
  location?: string | null;
}) {
  const supabase = await createClient();
  const context = await getRequestContext();
  const rawSessionIdentifier =
    args.sessionIdentifier ||
    [args.userId, context.ipAddress, context.userAgent, randomUUID()].join(":");

  const { error } = await (supabase as any).from("user_session_events").insert({
    user_id: args.userId,
    session_identifier: hashSessionIdentifier(rawSessionIdentifier),
    device_type: inferDeviceType(context.userAgent),
    browser: inferBrowser(context.userAgent),
    os: inferOs(context.userAgent),
    ip_address: context.ipAddress,
    location: args.location ?? null,
    event_type: args.eventType,
    last_seen_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to write user session event", error);
  }
}
