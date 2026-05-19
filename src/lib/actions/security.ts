"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth/require-profile";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionHash } from "@/lib/security/active-sessions";
import { logSecurityEvent } from "@/lib/security/events";
import {
  recoveryContactSchema,
  trustedDeviceStatusSchema,
  updatePasswordSchema,
  updateSecurityQuestionsSchema,
  updateSecuritySettingsSchema,
  type RecoveryContactValues,
  type TrustedDeviceStatus,
  type UpdatePasswordValues,
  type UpdateSecuritySettingsValues,
} from "@/lib/validations/security";

type ActionResponse = { success: true } | { error: string };
type TwoFactorStatus = "not_configured" | "pending" | "enabled" | "disabled";
type TwoFactorSettings = {
  provider: "totp";
  status: TwoFactorStatus;
  supabase_factor_id: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  last_verified_at: string | null;
  backup_codes_generated_at: string | null;
  backup_codes_remaining: number;
};

const defaultSecuritySettings = {
  login_alerts_enabled: true,
  alert_new_device_signins: true,
  alert_new_location_signins: true,
  alert_unusual_signin_attempts: true,
  alert_successful_signins: true,
  alert_email_enabled: true,
  alert_sms_enabled: false,
  alert_frequency: "instant",
  alert_tone: "default",
  password_expiry_reminder_enabled: true,
  session_timeout_minutes: 30,
  restrict_login_by_ip: false,
  require_2fa_for_all_logins: false,
  security_questions_enabled: false,
} as const;

const defaultTwoFactorSettings = {
  provider: "totp",
  status: "not_configured",
  supabase_factor_id: null,
  enabled_at: null,
  disabled_at: null,
  last_verified_at: null,
  backup_codes_generated_at: null,
  backup_codes_remaining: 0,
} satisfies TwoFactorSettings;

function normalizeSecret(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function hashSecret(value: string, salt: string) {
  return createHash("sha256")
    .update(`${salt}:${normalizeSecret(value)}`)
    .digest("hex");
}

function createSalt() {
  return randomBytes(24).toString("hex");
}

function mergeSecuritySettings(settings: Record<string, unknown> | null) {
  return {
    ...defaultSecuritySettings,
    ...(settings ?? {}),
  };
}

function mergeTwoFactorSettings(
  settings: Partial<TwoFactorSettings> | null
): TwoFactorSettings {
  return {
    ...defaultTwoFactorSettings,
    ...(settings ?? {}),
  };
}

export async function getMySecurityWorkspaceData() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const currentSessionIdentifier = await getCurrentSessionHash();

  const [
    settingsResult,
    twoFactorResult,
    recoveryContactsResult,
    questionsResult,
    activeSessionsResult,
    securityEventsResult,
    backupCodesResult,
  ] = await Promise.all([
    (supabase as any)
      .from("user_security_settings")
      .select(
        `
          user_id,
          login_alerts_enabled,
          alert_new_device_signins,
          alert_new_location_signins,
          alert_unusual_signin_attempts,
          alert_successful_signins,
          alert_email_enabled,
          alert_sms_enabled,
          alert_frequency,
          alert_tone,
          password_expiry_reminder_enabled,
          session_timeout_minutes,
          restrict_login_by_ip,
          require_2fa_for_all_logins,
          security_questions_enabled,
          created_at,
          updated_at
        `
      )
      .eq("user_id", profile.id)
      .maybeSingle(),
    (supabase as any)
      .from("user_2fa_settings")
      .select(
        `
          user_id,
          provider,
          status,
          supabase_factor_id,
          enabled_at,
          disabled_at,
          last_verified_at,
          backup_codes_generated_at,
          backup_codes_remaining,
          created_at,
          updated_at
        `
      )
      .eq("user_id", profile.id)
      .maybeSingle(),
    (supabase as any)
      .from("user_recovery_contacts")
      .select(
        "id, user_id, contact_type, contact_value, is_primary, verification_status, verified_at, created_at, updated_at"
      )
      .eq("user_id", profile.id)
      .order("contact_type", { ascending: true })
      .order("is_primary", { ascending: false }),
    (supabase as any)
      .from("user_security_questions")
      .select("id, user_id, position, question, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("position", { ascending: true }),
    (supabase as any)
      .from("user_active_sessions")
      .select(
        `
          id,
          user_id,
          session_identifier,
          device_type,
          browser,
          os,
          ip_address,
          location,
          user_agent,
          status,
          trusted_status,
          trusted_at,
          reviewed_at,
          is_2fa_verified,
          last_2fa_verified_at,
          first_seen_at,
          last_seen_at,
          signed_out_at,
          revoked_at,
          created_at,
          updated_at
        `
      )
      .eq("user_id", profile.id)
      .order("last_seen_at", { ascending: false }),
    (supabase as any)
      .from("user_security_events")
      .select("id, user_id, event_type, ip_address, user_agent, metadata, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
    (supabase as any)
      .from("user_backup_codes")
      .select("id, used_at, created_at")
      .eq("user_id", profile.id),
  ]);

  const backupCodes = backupCodesResult.data ?? [];
  const unusedBackupCodes = backupCodes.filter(
    (code: { used_at: string | null }) => !code.used_at
  );
  const activeSessions = activeSessionsResult.data ?? [];
  const twoFactor = mergeTwoFactorSettings(
    twoFactorResult.data as Partial<TwoFactorSettings> | null
  );

  return {
    profile: {
      id: profile.id,
      first_name: profile.first_name,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      department: profile.department,
    },
    settings: mergeSecuritySettings(settingsResult.data),
    twoFactor: {
      ...twoFactor,
      backup_codes_remaining:
        twoFactor.backup_codes_remaining || unusedBackupCodes.length,
    },
    recoveryContacts: recoveryContactsResult.data ?? [],
    securityQuestions: questionsResult.data ?? [],
    activeSessions,
    currentSessionIdentifier,
    securityEvents: securityEventsResult.data ?? [],
    overview: {
      security_score:
        twoFactor.status === "enabled" &&
        activeSessions.every(
          (session: { trusted_status?: string }) =>
            session.trusted_status !== "unrecognized" &&
            session.trusted_status !== "blocked"
        )
          ? "excellent"
          : "needs_review",
      active_session_count: activeSessions.filter(
        (session: { status: string }) => session.status === "active"
      ).length,
      two_factor_status: twoFactor.status,
      unused_backup_code_count: unusedBackupCodes.length,
      unrecognized_device_count: activeSessions.filter(
        (session: { trusted_status?: string }) =>
          session.trusted_status === "unrecognized"
      ).length,
    },
    errors: {
      settings: settingsResult.error?.message ?? null,
      twoFactor: twoFactorResult.error?.message ?? null,
      recoveryContacts: recoveryContactsResult.error?.message ?? null,
      securityQuestions: questionsResult.error?.message ?? null,
      activeSessions: activeSessionsResult.error?.message ?? null,
      securityEvents: securityEventsResult.error?.message ?? null,
      backupCodes: backupCodesResult.error?.message ?? null,
    },
  };
}

export async function updateMySecuritySettingsAction(
  values: UpdateSecuritySettingsValues
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = updateSecuritySettingsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid security settings",
    };
  }

  const { error } = await (supabase as any).from("user_security_settings").upsert({
    user_id: profile.id,
    ...parsed.data,
  });

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "security_settings_updated",
    metadata: {
      login_alerts_enabled: parsed.data.login_alerts_enabled,
      require_2fa_for_all_logins: parsed.data.require_2fa_for_all_logins,
      restrict_login_by_ip: parsed.data.restrict_login_by_ip,
      session_timeout_minutes: parsed.data.session_timeout_minutes,
    },
  });

  revalidatePath("/settings/security");

  return { success: true };
}

export async function updateMyPasswordAction(
  values: UpdatePasswordValues
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = updatePasswordSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid password change request",
    };
  }

  if (!profile.email) {
    return {
      error: "Your profile does not have an email address attached.",
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.current_password,
  });

  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "password_changed",
    metadata: {
      source: "settings_security",
    },
  });

  revalidatePath("/settings/security");

  return { success: true };
}

export async function updateMySecurityQuestionsAction(
  values: z.infer<typeof updateSecurityQuestionsSchema>
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = updateSecurityQuestionsSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid security questions",
    };
  }

  const rows = parsed.data.map((question) => {
    const salt = createSalt();

    return {
      user_id: profile.id,
      position: question.position,
      question: question.question,
      answer_salt: salt,
      answer_hash: hashSecret(question.answer, salt),
    };
  });

  const { error: upsertError } = await (supabase as any)
    .from("user_security_questions")
    .upsert(rows, {
      onConflict: "user_id,position",
    });

  if (upsertError) {
    return { error: upsertError.message };
  }

  const positions = parsed.data.map((question) => question.position);
  const { error: deleteError } = await (supabase as any)
    .from("user_security_questions")
    .delete()
    .eq("user_id", profile.id)
    .not("position", "in", `(${positions.join(",")})`);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: settingsError } = await (supabase as any)
    .from("user_security_settings")
    .upsert({
      user_id: profile.id,
      security_questions_enabled: rows.length > 0,
    });

  if (settingsError) {
    return { error: settingsError.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "security_questions_updated",
    metadata: {
      question_count: rows.length,
    },
  });

  revalidatePath("/settings/security");

  return { success: true };
}

export async function upsertMyRecoveryContactAction(
  values: RecoveryContactValues
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = recoveryContactSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid recovery contact",
    };
  }

  if (parsed.data.is_primary) {
    const { error: primaryError } = await (supabase as any)
      .from("user_recovery_contacts")
      .update({ is_primary: false })
      .eq("user_id", profile.id)
      .eq("contact_type", parsed.data.contact_type);

    if (primaryError) {
      return { error: primaryError.message };
    }
  }

  const row = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    user_id: profile.id,
    contact_type: parsed.data.contact_type,
    contact_value: parsed.data.contact_value,
    is_primary: parsed.data.is_primary,
    verification_status: "unverified",
    verified_at: null,
  };

  const { error } = await (supabase as any)
    .from("user_recovery_contacts")
    .upsert(row);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "recovery_contact_updated",
    metadata: {
      contact_type: parsed.data.contact_type,
      is_primary: parsed.data.is_primary,
    },
  });

  revalidatePath("/settings/security");

  return { success: true };
}

export async function deleteMyRecoveryContactAction(
  recoveryContactId: string
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsed = z.string().uuid().safeParse(recoveryContactId);

  if (!parsed.success) {
    return { error: "Invalid recovery contact id" };
  }

  const { error } = await (supabase as any)
    .from("user_recovery_contacts")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", profile.id);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "recovery_contact_updated",
    metadata: {
      deleted: true,
    },
  });

  revalidatePath("/settings/security");

  return { success: true };
}

export async function updateMyTrustedDeviceStatusAction(
  activeSessionId: string,
  trustedStatus: TrustedDeviceStatus
): Promise<ActionResponse> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const parsedSessionId = z.string().uuid().safeParse(activeSessionId);
  const parsedStatus = trustedDeviceStatusSchema.safeParse(trustedStatus);

  if (!parsedSessionId.success) {
    return { error: "Invalid session id" };
  }

  if (!parsedStatus.success) {
    return { error: "Invalid trusted device status" };
  }

  const now = new Date().toISOString();
  const updatePayload =
    parsedStatus.data === "blocked"
      ? {
          trusted_status: parsedStatus.data,
          trusted_at: null,
          reviewed_at: now,
          status: "revoked",
          revoked_at: now,
          last_seen_at: now,
        }
      : {
          trusted_status: parsedStatus.data,
          trusted_at: parsedStatus.data === "trusted" ? now : null,
          reviewed_at: now,
        };

  const { error } = await (supabase as any)
    .from("user_active_sessions")
    .update(updatePayload)
    .eq("id", parsedSessionId.data)
    .eq("user_id", profile.id);

  if (error) {
    return { error: error.message };
  }

  await logSecurityEvent({
    userId: profile.id,
    eventType: "trusted_device_updated",
    metadata: {
      active_session_id: parsedSessionId.data,
      trusted_status: parsedStatus.data,
    },
  });

  revalidatePath("/settings/security");
  revalidatePath("/settings/sessions");

  return { success: true };
}
