"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/require-profile";
import { signOutAction } from "@/lib/actions/auth";
import {
  getCurrentSessionHash,
  markActiveSessionRevoked,
  touchActiveSession,
} from "@/lib/security/active-sessions";
import { logSecurityEvent } from "@/lib/security/events";

type ActionResponse = { success: true } | { error: string };

export async function getMySessionsDataAction() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await touchActiveSession({
    userId: profile.id,
  });

  const currentSessionIdentifier = await getCurrentSessionHash();

  const [{ data: activeSessions, error: activeError }, { data: events, error: eventsError }] =
    await Promise.all([
      (supabase as any)
        .from("user_active_sessions")
        .select(
          "id, session_identifier, device_type, browser, os, ip_address, location, user_agent, status, first_seen_at, last_seen_at, signed_out_at, revoked_at, created_at, updated_at"
        )
        .eq("user_id", profile.id)
        .order("last_seen_at", { ascending: false }),
      (supabase as any)
        .from("user_session_events")
        .select(
          "id, session_identifier, device_type, browser, os, ip_address, location, event_type, last_seen_at, created_at"
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (activeError) {
    return {
      error: activeError.message,
      activeSessions: [],
      sessionEvents: events ?? [],
      currentSessionIdentifier,
    };
  }

  if (eventsError) {
    return {
      error: eventsError.message,
      activeSessions: activeSessions ?? [],
      sessionEvents: [],
      currentSessionIdentifier,
    };
  }

  return {
    activeSessions: activeSessions ?? [],
    sessionEvents: events ?? [],
    currentSessionIdentifier,
  };
}

export async function refreshMySessionsAction(): Promise<ActionResponse> {
  const profile = await requireProfile();

  await touchActiveSession({
    userId: profile.id,
  });

  revalidatePath("/settings/sessions");

  return { success: true };
}

export async function revokeMyActiveSessionAction(
  activeSessionId: string
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = z.string().uuid().safeParse(activeSessionId);

  if (!parsed.success) {
    return { error: "Invalid session id" };
  }

  const currentSessionIdentifier = await getCurrentSessionHash();
  const { data: session, error: fetchError } = await (supabase as any)
    .from("user_active_sessions")
    .select("id, session_identifier, status")
    .eq("id", parsed.data)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!session) {
    return { error: "Session not found" };
  }

  if (session.session_identifier === currentSessionIdentifier) {
    return {
      error:
        "Use Sign Out for your current session. Remote revocation is only for other recorded sessions.",
    };
  }

  const result = await markActiveSessionRevoked({
    userId: profile.id,
    activeSessionId: parsed.data,
  });

  if ("error" in result) {
    return result;
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "logout",
    metadata: {
      active_session_id: parsed.data,
      action: "session_revoked_in_crm_registry",
    },
  });

  revalidatePath("/settings/sessions");

  return { success: true };
}

export async function signOutCurrentSessionAction() {
  await signOutAction();
}
