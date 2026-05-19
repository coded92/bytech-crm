"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Save,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
} from "lucide-react";
import {
  deleteMyRecoveryContactAction,
  updateMyPasswordAction,
  updateMySecurityQuestionsAction,
  updateMySecuritySettingsAction,
  updateMyTrustedDeviceStatusAction,
  upsertMyRecoveryContactAction,
} from "@/lib/actions/security";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type SecurityTab =
  | "password"
  | "two_factor"
  | "login_alerts"
  | "trusted_devices"
  | "questions";

type SecuritySettings = {
  login_alerts_enabled: boolean;
  alert_new_device_signins: boolean;
  alert_new_location_signins: boolean;
  alert_unusual_signin_attempts: boolean;
  alert_successful_signins: boolean;
  alert_email_enabled: boolean;
  alert_sms_enabled: boolean;
  alert_frequency: "instant" | "daily" | "weekly";
  alert_tone: "default" | "subtle" | "urgent";
  password_expiry_reminder_enabled: boolean;
  session_timeout_minutes: number;
  restrict_login_by_ip: boolean;
  require_2fa_for_all_logins: boolean;
  security_questions_enabled: boolean;
};

type TwoFactorSettings = {
  provider: "totp";
  status: "not_configured" | "pending" | "enabled" | "disabled";
  supabase_factor_id: string | null;
  enabled_at: string | null;
  disabled_at: string | null;
  last_verified_at: string | null;
  backup_codes_generated_at: string | null;
  backup_codes_remaining: number;
};

type RecoveryContact = {
  id: string;
  contact_type: "email" | "phone";
  contact_value: string;
  is_primary: boolean;
  verification_status: "unverified" | "pending" | "verified";
  verified_at: string | null;
};

type SecurityQuestion = {
  id: string;
  position: number;
  question: string;
};

type ActiveSession = {
  id: string;
  session_identifier: string;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  status: "active" | "signed_out" | "expired" | "revoked";
  trusted_status?: "trusted" | "unrecognized" | "review" | "blocked";
  trusted_at?: string | null;
  reviewed_at?: string | null;
  is_2fa_verified?: boolean;
  last_2fa_verified_at?: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

type SecurityEvent = {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const tabs: Array<{ key: SecurityTab; label: string }> = [
  { key: "password", label: "Password & Authentication" },
  { key: "two_factor", label: "Two-Factor Authentication" },
  { key: "login_alerts", label: "Login Alerts" },
  { key: "trusted_devices", label: "Trusted Devices" },
  { key: "questions", label: "Security Questions" },
];

export function SecuritySettingsPanel({
  settings,
  twoFactor,
  recoveryContacts,
  securityQuestions,
  activeSessions,
  currentSessionIdentifier,
  securityEvents,
}: {
  settings: SecuritySettings;
  twoFactor: TwoFactorSettings;
  recoveryContacts: RecoveryContact[];
  securityQuestions: SecurityQuestion[];
  activeSessions: ActiveSession[];
  currentSessionIdentifier: string | null;
  securityEvents: SecurityEvent[];
}) {
  const [activeTab, setActiveTab] = useState<SecurityTab>("password");

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-7">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "border-b-2 px-1 pb-3 text-sm font-black transition",
                activeTab === tab.key
                  ? "border-[var(--bytech-accent)] text-[var(--bytech-accent)]"
                  : "border-transparent text-[#111827] hover:text-[var(--bytech-accent)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "password" ? (
        <PasswordTab
          settings={settings}
          twoFactor={twoFactor}
          activeSessions={activeSessions}
          currentSessionIdentifier={currentSessionIdentifier}
          securityEvents={securityEvents}
        />
      ) : null}

      {activeTab === "two_factor" ? (
        <TwoFactorTab
          twoFactor={twoFactor}
          recoveryContacts={recoveryContacts}
          activeSessions={activeSessions}
          currentSessionIdentifier={currentSessionIdentifier}
        />
      ) : null}

      {activeTab === "login_alerts" ? (
        <LoginAlertsTab
          settings={settings}
          recoveryContacts={recoveryContacts}
          securityEvents={securityEvents}
        />
      ) : null}

      {activeTab === "trusted_devices" ? (
        <TrustedDevicesTab
          activeSessions={activeSessions}
          currentSessionIdentifier={currentSessionIdentifier}
        />
      ) : null}

      {activeTab === "questions" ? (
        <SecurityQuestionsTab securityQuestions={securityQuestions} />
      ) : null}
    </div>
  );
}

function PasswordTab({
  settings,
  twoFactor,
  activeSessions,
  currentSessionIdentifier,
  securityEvents,
}: {
  settings: SecuritySettings;
  twoFactor: TwoFactorSettings;
  activeSessions: ActiveSession[];
  currentSessionIdentifier: string | null;
  securityEvents: SecurityEvent[];
}) {
  return (
    <div className="grid gap-5 2xl:grid-cols-2">
      <PasswordCard />
      <Card title="Two-Factor Authentication (2FA)" description="Add an extra layer of security to your account.">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-black text-emerald-800">
                  2FA is {twoFactor.status === "enabled" ? "enabled" : "not configured"}
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Supabase MFA enrollment is the next backend integration before this can protect sign-in.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" disabled>
              Manage 2FA
            </Button>
          </div>
        </div>

        <div className="mt-5 divide-y divide-slate-200">
          <SummaryRow label="Authenticator App" value={twoFactor.provider === "totp" ? "TOTP provider metadata ready" : "Not configured"} />
          <SummaryRow label="Backup Codes" value={`${twoFactor.backup_codes_remaining} unused codes recorded`} />
        </div>
      </Card>

      <Card title="Recent Login Activity" description="Review your recent account access and login history.">
        <div className="divide-y divide-slate-200">
          {activeSessions.slice(0, 4).map((session) => (
            <SessionMiniRow
              key={session.id}
              session={session}
              current={session.session_identifier === currentSessionIdentifier}
            />
          ))}
          {activeSessions.length === 0 ? (
            <EmptyLine message="No active sessions recorded yet." />
          ) : null}
        </div>
      </Card>

      <Card title="Security Settings" description="Configure additional security preferences.">
        <SecuritySettingsForm settings={settings} compact />
      </Card>
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card title="Change Password" description="Update your password regularly to keep your account secure.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          startTransition(async () => {
            const result = await updateMyPasswordAction({
              current_password: currentPassword,
              new_password: newPassword,
              confirm_password: confirmPassword,
            });

            if ("error" in result) {
              setError(result.error);
              return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage("Password updated successfully.");
          });
        }}
      >
        <PasswordInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
        <PasswordInput label="New Password" value={newPassword} onChange={setNewPassword} helper={newPassword.length >= 8 ? "Strong" : undefined} />
        <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
        {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
        {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TwoFactorTab({
  twoFactor,
  recoveryContacts,
  activeSessions,
  currentSessionIdentifier,
}: {
  twoFactor: TwoFactorSettings;
  recoveryContacts: RecoveryContact[];
  activeSessions: ActiveSession[];
  currentSessionIdentifier: string | null;
}) {
  const devicesWithTwoFactor = activeSessions.filter(
    (session) => session.is_2fa_verified
  );

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card title="Two-Factor Authentication (2FA)" description="Real MFA enrollment is not enabled until Supabase MFA APIs are wired.">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </span>
            <div>
              <p className="font-black text-amber-900">
                2FA provider integration pending
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                The database can store MFA state, but the authenticator QR and verification flow must be connected to Supabase MFA before this button can be enabled.
              </p>
            </div>
          </div>
        </div>

        <ol className="mt-5 space-y-4">
          <InstructionStep number={1} title="Open your authenticator app" detail="Google Authenticator, Authy, Microsoft Authenticator, or a compatible TOTP app." disabled />
          <InstructionStep number={2} title="Scan this QR code" detail="QR generation will come from Supabase MFA enrollment." disabled />
          <InstructionStep number={3} title="Enter the 6-digit code" detail="Verification will be enabled after provider integration." disabled />
        </ol>

        <input
          disabled
          placeholder="Enter 6-digit code"
          className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400 outline-none"
        />
        <Button type="button" disabled className="mt-4 w-full">
          Verify & Enable 2FA
        </Button>
      </Card>

      <div className="space-y-5">
        <Card title="Backup Codes" description="Hashed backup-code storage is ready. Codes become useful after MFA is wired.">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <IconBox tone="purple">
                <KeyRound className="size-5" />
              </IconBox>
              <span className="text-sm font-bold text-[#111827]">
                {twoFactor.backup_codes_remaining} unused codes remaining
              </span>
            </div>
            <Button type="button" variant="outline" disabled>
              View Codes
            </Button>
          </div>
        </Card>

        <RecoveryContactsCard recoveryContacts={recoveryContacts} />

        <Card title="Devices with 2FA" description="Devices will appear here after real MFA verification is recorded.">
          <div className="divide-y divide-slate-200">
            {devicesWithTwoFactor.map((session) => (
              <SessionMiniRow
                key={session.id}
                session={session}
                current={session.session_identifier === currentSessionIdentifier}
              />
            ))}
            {devicesWithTwoFactor.length === 0 ? (
              <EmptyLine message="No sessions have recorded 2FA verification yet." />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function LoginAlertsTab({
  settings,
  recoveryContacts,
  securityEvents,
}: {
  settings: SecuritySettings;
  recoveryContacts: RecoveryContact[];
  securityEvents: SecurityEvent[];
}) {
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <Card
        title="Login Alerts"
        description="Get notified whenever new devices or locations access your account."
      >
        <SecuritySettingsForm settings={settings} />
      </Card>

      <div className="space-y-5">
        <Card title="Recent Login Alerts" description="Latest real security events for your account.">
          <div className="divide-y divide-slate-200">
            {securityEvents.slice(0, 5).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
            {securityEvents.length === 0 ? (
              <EmptyLine message="No security alerts have been recorded yet." />
            ) : null}
          </div>
        </Card>

        <Card title="Delivery Channels" description="Contact methods used for login and security notifications.">
          <div className="divide-y divide-slate-200">
            {recoveryContacts.map((contact) => (
              <ContactRow key={contact.id} contact={contact} />
            ))}
            {recoveryContacts.length === 0 ? (
              <EmptyLine message="No recovery contacts saved yet." />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TrustedDevicesTab({
  activeSessions,
  currentSessionIdentifier,
}: {
  activeSessions: ActiveSession[];
  currentSessionIdentifier: string | null;
}) {
  const activeOnly = activeSessions.filter((session) => session.status === "active");
  const allRecognized = activeOnly.every(
    (session) => (session.trusted_status ?? "trusted") === "trusted"
  );

  return (
    <Card title="Trusted Devices" description="These are the recorded devices that have access to your account.">
      <div
        className={cn(
          "mb-5 rounded-2xl border p-4",
          allRecognized
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        )}
      >
        <div className="flex gap-3">
          <IconBox tone={allRecognized ? "green" : "orange"}>
            {allRecognized ? (
              <ShieldCheck className="size-5" />
            ) : (
              <AlertTriangle className="size-5" />
            )}
          </IconBox>
          <div>
            <p className={cn("font-black", allRecognized ? "text-emerald-800" : "text-amber-900")}>
              {allRecognized ? "All recognized devices are trusted" : "Some devices need review"}
            </p>
            <p className={cn("mt-1 text-sm font-medium", allRecognized ? "text-emerald-700" : "text-amber-800")}>
              Blocking a device records it as blocked and revokes that CRM session.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Last Active</th>
              <th className="px-4 py-3">Browser / OS</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {activeOnly.map((session) => (
              <TrustedDeviceRow
                key={session.id}
                session={session}
                current={session.session_identifier === currentSessionIdentifier}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SecurityQuestionsTab({
  securityQuestions,
}: {
  securityQuestions: SecurityQuestion[];
}) {
  const initialQuestions =
    securityQuestions.length > 0
      ? securityQuestions.map((question) => ({
          position: question.position,
          question: question.question,
          answer: "",
        }))
      : [
          { position: 1, question: "", answer: "" },
          { position: 2, question: "", answer: "" },
          { position: 3, question: "", answer: "" },
        ];
  const [questions, setQuestions] = useState(initialQuestions);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <Card title="Security Questions" description="These questions help verify your identity if you need account recovery.">
        {securityQuestions.length > 0 ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex gap-3">
              <IconBox tone="green">
                <ShieldCheck className="size-5" />
              </IconBox>
              <div>
                <p className="font-black text-emerald-800">
                  Security questions are set
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-700">
                  Answers are stored as salted hashes, never plain text.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("");
            setError("");
            startTransition(async () => {
              const result = await updateMySecurityQuestionsAction(questions);

              if ("error" in result) {
                setError(result.error);
                return;
              }

              setMessage("Security questions updated.");
            });
          }}
        >
          {questions.map((question, index) => (
            <div
              key={question.position}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F1ECFF] text-sm font-black text-[var(--bytech-accent)]">
                  {question.position}
                </span>
                <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-slate-500">Question</span>
                    <input
                      value={question.question}
                      onChange={(event) => {
                        const next = [...questions];
                        next[index] = {
                          ...next[index],
                          question: event.target.value,
                        };
                        setQuestions(next);
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[var(--bytech-accent)]"
                      placeholder="What was the name of your first school?"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-slate-500">Your Answer</span>
                    <input
                      type="password"
                      value={question.answer}
                      onChange={(event) => {
                        const next = [...questions];
                        next[index] = {
                          ...next[index],
                          answer: event.target.value,
                        };
                        setQuestions(next);
                      }}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[var(--bytech-accent)]"
                      placeholder="Enter answer"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}

          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
          {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}

          <div className="rounded-2xl bg-[#F7F5FF] px-4 py-3 text-sm font-medium text-slate-600">
            Make sure your answers are memorable to you but hard for others to guess.
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldQuestion className="size-4" />}
              Update Questions
            </Button>
          </div>
        </form>
      </Card>

      <Card title="About Security Questions">
        <div className="space-y-5">
          <Guidance icon={<KeyRound />} title="Extra account recovery option" detail="Use answers only you know for identity checks." />
          <Guidance icon={<LockKeyhole />} title="Keep answers private" detail="Answers are stored as hashes and are never displayed." />
          <Guidance icon={<ShieldQuestion />} title="Update anytime" detail="You can replace questions and answers when needed." />
        </div>
      </Card>
    </div>
  );
}

function SecuritySettingsForm({
  settings,
  compact = false,
}: {
  settings: SecuritySettings;
  compact?: boolean;
}) {
  const [values, setValues] = useState(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggles = compact
    ? [
        ["login_alerts_enabled", "Login Alert Emails", "Get notified when new devices sign in"],
        ["password_expiry_reminder_enabled", "Password Expiry Reminder", "Get reminded before your password expires"],
        ["require_2fa_for_all_logins", "Require 2FA for All Logins", "Preference only until Supabase MFA enforcement is wired"],
      ]
    : [
        ["login_alerts_enabled", "Login alerts", "Notify me about sign-ins and security events"],
        ["alert_new_device_signins", "New device sign-ins", "A new device signs in to your account"],
        ["alert_new_location_signins", "Sign-ins from new locations", "Your account is accessed from a new location"],
        ["alert_unusual_signin_attempts", "Unusual sign-in attempts", "Suspicious or unusual sign-in activity"],
        ["alert_successful_signins", "Successful sign-ins", "Any successful sign-in event"],
        ["alert_email_enabled", "Email", "Use email for security alerts"],
        ["alert_sms_enabled", "SMS", "Use verified phone numbers for security alerts"],
      ];

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        startTransition(async () => {
          const result = await updateMySecuritySettingsAction(values);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          setMessage("Security settings saved.");
        });
      }}
    >
      <div className="divide-y divide-slate-200">
        {toggles.map(([key, label, description]) => (
          <ToggleRow
            key={key}
            label={label}
            description={description}
            checked={Boolean(values[key as keyof SecuritySettings])}
            onChange={(checked) =>
              setValues((current) => ({
                ...current,
                [key]: checked,
              }))
            }
          />
        ))}
      </div>

      {!compact ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Frequency"
            value={values.alert_frequency}
            options={[
              ["instant", "Instant"],
              ["daily", "Daily"],
              ["weekly", "Weekly"],
            ]}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                alert_frequency: value as SecuritySettings["alert_frequency"],
              }))
            }
          />
          <SelectField
            label="Alert tone"
            value={values.alert_tone}
            options={[
              ["default", "Default"],
              ["subtle", "Subtle"],
              ["urgent", "Urgent"],
            ]}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                alert_tone: value as SecuritySettings["alert_tone"],
              }))
            }
          />
          <SelectField
            label="Session timeout"
            value={String(values.session_timeout_minutes)}
            options={[
              ["15", "15 minutes"],
              ["30", "30 minutes"],
              ["60", "1 hour"],
              ["120", "2 hours"],
            ]}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                session_timeout_minutes: Number(value),
              }))
            }
          />
        </div>
      ) : null}

      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {message ? <p className="text-sm font-bold text-emerald-700">{message}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Preferences
        </Button>
      </div>
    </form>
  );
}

function RecoveryContactsCard({
  recoveryContacts,
}: {
  recoveryContacts: RecoveryContact[];
}) {
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card title="Recovery Options" description="Manage real recovery contact metadata. Verification workflow comes next.">
      <div className="divide-y divide-slate-200">
        {recoveryContacts.map((contact) => (
          <ContactRow key={contact.id} contact={contact} removable />
        ))}
        {recoveryContacts.length === 0 ? (
          <EmptyLine message="No recovery contacts saved yet." />
        ) : null}
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setError("");
          startTransition(async () => {
            const result = await upsertMyRecoveryContactAction({
              contact_type: contactType,
              contact_value: contactValue,
              is_primary: recoveryContacts.every(
                (contact) => contact.contact_type !== contactType
              ),
            });

            if ("error" in result) {
              setError(result.error);
              return;
            }

            setContactValue("");
            setMessage("Recovery contact saved.");
          });
        }}
      >
        <select
          value={contactType}
          onChange={(event) => setContactType(event.target.value as "email" | "phone")}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
        <input
          value={contactValue}
          onChange={(event) => setContactValue(event.target.value)}
          placeholder={contactType === "email" ? "name@example.com" : "+234 800 000 0000"}
          className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[var(--bytech-accent)]"
        />
        <Button type="submit" variant="outline" disabled={isPending}>
          Add
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-sm font-bold text-emerald-700">{message}</p> : null}
    </Card>
  );
}

function TrustedDeviceRow({
  session,
  current,
}: {
  session: ActiveSession;
  current: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const status = session.trusted_status ?? "trusted";
  const statusTone =
    status === "trusted"
      ? "success"
      : status === "blocked"
        ? "danger"
        : "warning";

  return (
    <tr>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <DeviceIcon deviceType={session.device_type} />
          <div>
            <p className="font-black text-[#111827]">
              {sessionTitle(session)}{" "}
              {current ? (
                <span className="ml-1 rounded-full bg-[#F1ECFF] px-2 py-0.5 text-xs font-bold text-[var(--bytech-accent)]">
                  This device
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {session.os ?? "Unknown OS"} · {session.browser ?? "Unknown browser"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-slate-600">
        <div className="font-semibold">{session.location ?? "Unknown"}</div>
        <div className="text-xs text-slate-500">IP: {session.ip_address ?? "-"}</div>
      </td>
      <td className="px-4 py-4 text-slate-600">
        {formatDateTime(session.last_seen_at)}
      </td>
      <td className="px-4 py-4 text-slate-600">
        <div className="font-semibold">{session.browser ?? "Unknown"}</div>
        <div className="text-xs text-slate-500">{session.os ?? "Unknown"}</div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge tone={statusTone}>{formatLabel(status)}</StatusBadge>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          {status !== "trusted" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await updateMyTrustedDeviceStatusAction(session.id, "trusted");
                });
              }}
              className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-black text-[var(--bytech-accent)] hover:bg-[#F7F5FF] disabled:opacity-60"
            >
              Trust
            </button>
          ) : null}
          {!current ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await updateMyTrustedDeviceStatusAction(session.id, "blocked");
                });
              }}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Block
            </button>
          ) : null}
          <MoreVertical className="size-4 text-slate-400" />
        </div>
      </td>
    </tr>
  );
}

function ContactRow({
  contact,
  removable = false,
}: {
  contact: RecoveryContact;
  removable?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox tone="slate">
          {contact.contact_type === "email" ? (
            <Mail className="size-5" />
          ) : (
            <Phone className="size-5" />
          )}
        </IconBox>
        <div className="min-w-0">
          <p className="truncate font-black text-[#111827]">
            {contact.contact_type === "email" ? "Recovery Email" : "Recovery Phone"}
          </p>
          <p className="truncate text-sm font-medium text-slate-500">
            {contact.contact_value}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge tone={contact.verification_status === "verified" ? "success" : "warning"}>
          {formatLabel(contact.verification_status)}
        </StatusBadge>
        {removable ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteMyRecoveryContactAction(contact.id);
              });
            }}
            className="text-xs font-black text-red-600 disabled:opacity-60"
          >
            Remove
          </button>
        ) : (
          <ChevronRight className="size-4 text-slate-400" />
        )}
      </div>
    </div>
  );
}

function SessionMiniRow({
  session,
  current = false,
}: {
  session: ActiveSession;
  current?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <DeviceIcon deviceType={session.device_type} />
        <div className="min-w-0">
          <p className="truncate font-black text-[#111827]">{sessionTitle(session)}</p>
          <p className="truncate text-sm font-medium text-slate-500">
            {[session.location, session.ip_address].filter(Boolean).join(" · ") || "Location unavailable"}
          </p>
        </div>
      </div>
      <div className="text-right">
        {current ? <StatusBadge tone="success">Current Session</StatusBadge> : null}
        <p className="mt-1 text-sm text-slate-500">
          {formatDateTime(session.last_seen_at)}
        </p>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: SecurityEvent }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconBox tone="blue">
          <Laptop className="size-5" />
        </IconBox>
        <div className="min-w-0">
          <p className="truncate font-black text-[#111827]">{formatLabel(event.event_type)}</p>
          <p className="truncate text-sm font-medium text-slate-500">
            {[event.ip_address, event.user_agent].filter(Boolean).join(" · ") || "Context unavailable"}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-medium text-slate-500">
        {formatRelativeTime(event.created_at)}
      </span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="font-black text-[#111827]">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-[var(--bytech-accent)]" : "bg-slate-300"
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <div className="relative">
        <input
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 text-sm font-semibold outline-none focus:border-[var(--bytech-accent)]"
        />
        <EyeOff className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        {helper ? (
          <span className="absolute right-11 top-1/2 -translate-y-1/2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
            {helper}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black text-[#111827]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[var(--bytech-accent)]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function InstructionStep({
  number,
  title,
  detail,
  disabled = false,
}: {
  number: number;
  title: string;
  detail: string;
  disabled?: boolean;
}) {
  return (
    <li className={cn("flex gap-3 rounded-2xl border border-slate-200 p-4", disabled && "opacity-60")}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F1ECFF] text-sm font-black text-[var(--bytech-accent)]">
        {number}
      </span>
      <div>
        <p className="font-black text-[#111827]">{title}</p>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{detail}</p>
      </div>
    </li>
  );
}

function Guidance({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex gap-4">
      <IconBox tone="purple">{icon}</IconBox>
      <div>
        <p className="font-black text-[#111827]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <span className="text-sm font-medium text-slate-500">{value}</span>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-sm shadow-indigo-100/50">
      <div className="mb-5">
        <h2 className="text-lg font-black tracking-tight text-[#111827]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  const Icon = deviceType === "mobile" ? Smartphone : Laptop;

  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      <Icon className="size-5" />
    </span>
  );
}

function IconBox({
  tone,
  children,
}: {
  tone: "purple" | "green" | "orange" | "blue" | "slate";
  children: React.ReactNode;
}) {
  const classes = {
    purple: "bg-[#F1ECFF] text-[var(--bytech-accent)]",
    green: "bg-emerald-100 text-emerald-700",
    orange: "bg-orange-100 text-orange-700",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  }[tone];

  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", classes)}>
      {children}
    </span>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const classes = {
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-black", classes)}>
      {children}
    </span>
  );
}

function EmptyLine({ message }: { message: string }) {
  return <p className="py-4 text-sm font-medium text-slate-500">{message}</p>;
}

function sessionTitle(session: ActiveSession) {
  const browser = session.browser || "Unknown browser";
  const os = session.os || "Unknown OS";
  return `${browser} on ${os}`;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
