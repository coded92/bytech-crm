import { format } from "date-fns";

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy");
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}