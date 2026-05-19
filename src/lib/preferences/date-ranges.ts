import type { UserPreferenceSnapshot } from "@/lib/preferences/user-preferences";

type StartOfWeek = UserPreferenceSnapshot["start_of_week"];

const weekdayIndexes: Record<StartOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export type DateRangeValue = {
  from: string;
  to: string;
};

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekStart(date: Date, startOfWeek: StartOfWeek) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  const weekStartIndex = weekdayIndexes[startOfWeek] ?? weekdayIndexes.monday;
  const dayOffset = (normalized.getDay() - weekStartIndex + 7) % 7;
  normalized.setDate(normalized.getDate() - dayOffset);

  return normalized;
}

export function getWeekEnd(date: Date, startOfWeek: StartOfWeek) {
  const weekEnd = getWeekStart(date, startOfWeek);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return weekEnd;
}

export function getCurrentWeekRange(
  preferences: Pick<UserPreferenceSnapshot, "start_of_week">,
  today = new Date()
): DateRangeValue {
  return {
    from: formatDateInputValue(getWeekStart(today, preferences.start_of_week)),
    to: formatDateInputValue(getWeekEnd(today, preferences.start_of_week)),
  };
}
