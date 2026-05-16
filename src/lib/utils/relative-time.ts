import { formatDistanceToNowStrict } from "date-fns";

export function formatRelativeTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}
