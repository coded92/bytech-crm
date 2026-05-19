"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent, logSessionEvent } from "@/lib/security/events";
import {
  markCurrentActiveSessionSignedOut,
  touchActiveSession,
} from "@/lib/security/active-sessions";
import {
  getCurrentUserPreferences,
  getLandingPagePath,
} from "@/lib/preferences/user-preferences";
import type { Profile } from "@/types/database";

export async function signInAction(
  previousStateOrFormData: unknown,
  submittedFormData?: FormData
) {
  const formData =
    submittedFormData ??
    (previousStateOrFormData instanceof FormData
      ? previousStateOrFormData
      : null);

  const email = String(formData?.get("email") || "").trim();
  const password = String(formData?.get("password") || "").trim();

  if (!email || !password) {
    return {
      error: "Email and password are required.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.session?.user?.id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, allowed_modules")
      .eq("id", data.session.user.id)
      .maybeSingle();

    await logSecurityEvent({
      userId: data.session.user.id,
      eventType: "login",
    });
    await logSessionEvent({
      userId: data.session.user.id,
      eventType: "login",
      sessionIdentifier: data.session.access_token,
    });
    await touchActiveSession({
      userId: data.session.user.id,
    });

    if (profileData) {
      const preferences = await getCurrentUserPreferences(data.session.user.id);
      const landingPath = getLandingPagePath(
        preferences,
        profileData as Pick<Profile, "role" | "allowed_modules">
      );

      redirect(landingPath);
    }
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    await logSecurityEvent({
      userId: session.user.id,
      eventType: "logout",
    });
    await logSessionEvent({
      userId: session.user.id,
      eventType: "logout",
      sessionIdentifier: session.access_token,
    });
    await markCurrentActiveSessionSignedOut({
      userId: session.user.id,
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
