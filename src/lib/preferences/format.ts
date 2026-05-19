import { defaultUserPreferences, type UserPreferenceSnapshot } from "./user-preferences";

type DateInput = string | number | Date | null | undefined;

export function formatUserDate(
  value: DateInput,
  preferences: Pick<UserPreferenceSnapshot, "date_format">
) {
  const date = normalizeDate(value);
  if (!date) return "-";

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear());

  switch (preferences.date_format) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
    default:
      return `${month}/${day}/${year}`;
  }
}

export function formatUserTime(
  value: DateInput,
  preferences: Pick<UserPreferenceSnapshot, "time_format">
) {
  const date = normalizeDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: preferences.time_format !== "24-hour",
  }).format(date);
}

export function formatUserDateTime(
  value: DateInput,
  preferences: Pick<UserPreferenceSnapshot, "date_format" | "time_format">
) {
  const date = normalizeDate(value);
  if (!date) return "-";

  return `${formatUserDate(date, preferences)} ${formatUserTime(date, preferences)}`;
}

export function getUserItemsPerPage(
  preferences: Pick<UserPreferenceSnapshot, "items_per_page"> | null | undefined
) {
  return preferences?.items_per_page ?? defaultUserPreferences.items_per_page;
}

function normalizeDate(value: DateInput) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
