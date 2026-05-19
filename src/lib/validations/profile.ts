import { z } from "zod";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || null);

export const updateMyProfileSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: optionalText(80),
  phone: optionalText(40),
  address: optionalText(240),
  city: optionalText(100),
  state: optionalText(100),
});

export const updateMyPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().trim().min(2).max(20),
  timezone: z.string().trim().min(1).max(80),
  compact_mode: z.boolean(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
});

export const generalSettingsPreferencesSchema = z.object({
  default_landing_page: z.enum([
    "dashboard",
    "leads",
    "customers",
    "projects",
    "field-jobs",
    "support",
    "inventory",
    "payments",
    "reports",
  ]),
  items_per_page: z.coerce.number().int().refine(
    (value) => [10, 25, 50, 100].includes(value),
    "Items per page must be 10, 25, 50, or 100"
  ),
  time_format: z.enum(["12-hour", "24-hour"]),
  date_format: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
  inline_editing_enabled: z.boolean(),
  start_of_week: z.enum([
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]),
  default_view_mode: z.enum(["comfortable", "compact"]),
  view_density: z.enum(["comfortable", "compact", "condensed"]),
  highlight_color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Highlight color must be a hex color"),
  show_avatars: z.boolean(),
  show_tooltips: z.boolean(),
  auto_save_changes: z.boolean(),
  show_productivity_tips: z.boolean(),
  confirm_before_deleting: z.boolean(),
  keyboard_shortcuts_enabled: z.boolean(),
});

export const notificationPreferenceSchema = z.object({
  channel: z.enum(["email", "in_app", "sms"]),
  event_type: z.enum([
    "customer_updates",
    "customer_activity",
    "project_updates",
    "task_assignments",
    "invoice_alerts",
    "payment_alerts",
    "field_job_updates",
    "inventory_alerts",
    "support_updates",
    "support_tickets",
    "system_alerts",
    "system_maintenance",
    "critical_alerts",
    "mentions_comments",
    "marketing_news",
  ]),
  enabled: z.boolean(),
  digest_frequency: z
    .enum(["immediate", "daily", "weekly"])
    .nullable()
    .optional(),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .nullable()
    .optional(),
});

export const updateNotificationPreferencesSchema = z
  .array(notificationPreferenceSchema)
  .min(1)
  .max(75);

export const notificationChannelSettingsSchema = z.object({
  channel: z.enum(["email", "in_app", "sms"]),
  email_frequency: z.enum(["instant", "daily", "weekly"]).nullable().optional(),
  email_format: z.enum(["html", "plain_text"]).nullable().optional(),
  digest_summary_enabled: z.boolean(),
  include_read_items: z.boolean(),
  browser_notifications_enabled: z.boolean(),
  play_sound: z.boolean(),
  show_unread_count: z.boolean(),
  sms_delivery_priority: z.enum(["normal", "high", "critical"]).nullable().optional(),
  quiet_hours_enabled: z.boolean(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .nullable()
    .optional(),
  timezone: z.string().trim().min(1).max(80).nullable().optional(),
});

export const updateNotificationChannelSettingsSchema = z
  .array(notificationChannelSettingsSchema)
  .min(1)
  .max(3);

export const notificationPhoneNumberSchema = z.object({
  id: z.string().uuid().optional(),
  phone_number: z.string().trim().min(3).max(40),
  label: z.string().trim().min(1).max(80),
  is_primary: z.boolean(),
});

export type UpdateMyProfileValues = z.infer<typeof updateMyProfileSchema>;
export type UpdateMyPreferencesValues = z.infer<
  typeof updateMyPreferencesSchema
>;
export type GeneralSettingsPreferenceValues = z.infer<
  typeof generalSettingsPreferencesSchema
>;
export type NotificationPreferenceValues = z.infer<
  typeof notificationPreferenceSchema
>;
export type NotificationChannelSettingsValues = z.infer<
  typeof notificationChannelSettingsSchema
>;
export type NotificationPhoneNumberValues = z.infer<
  typeof notificationPhoneNumberSchema
>;
