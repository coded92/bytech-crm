import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || null);

export const updateSecuritySettingsSchema = z.object({
  login_alerts_enabled: z.boolean(),
  alert_new_device_signins: z.boolean(),
  alert_new_location_signins: z.boolean(),
  alert_unusual_signin_attempts: z.boolean(),
  alert_successful_signins: z.boolean(),
  alert_email_enabled: z.boolean(),
  alert_sms_enabled: z.boolean(),
  alert_frequency: z.enum(["instant", "daily", "weekly"]),
  alert_tone: z.enum(["default", "subtle", "urgent"]),
  password_expiry_reminder_enabled: z.boolean(),
  session_timeout_minutes: z.coerce.number().int().min(5).max(1440),
  restrict_login_by_ip: z.boolean(),
  require_2fa_for_all_logins: z.boolean(),
});

export const updatePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password is too long"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((value) => value.current_password !== value.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

export const securityQuestionSchema = z.object({
  position: z.coerce.number().int().min(1).max(5),
  question: z.string().trim().min(8).max(180),
  answer: z.string().trim().min(3).max(180),
});

export const updateSecurityQuestionsSchema = z
  .array(securityQuestionSchema)
  .min(1, "Add at least one security question")
  .max(5, "You can add up to five security questions")
  .refine(
    (questions) =>
      new Set(questions.map((question) => question.position)).size ===
      questions.length,
    "Security question positions must be unique"
  );

export const recoveryContactSchema = z.object({
  id: z.string().uuid().optional(),
  contact_type: z.enum(["email", "phone"]),
  contact_value: z.string().trim().min(3).max(180),
  is_primary: z.boolean(),
});

export const trustedDeviceStatusSchema = z.enum([
  "trusted",
  "unrecognized",
  "review",
  "blocked",
]);

export type UpdateSecuritySettingsValues = z.infer<
  typeof updateSecuritySettingsSchema
>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
export type SecurityQuestionValues = z.infer<typeof securityQuestionSchema>;
export type RecoveryContactValues = z.infer<typeof recoveryContactSchema>;
export type TrustedDeviceStatus = z.infer<typeof trustedDeviceStatusSchema>;
