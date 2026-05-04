import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a 24hr time string to 12hr format
 * Example: "09:00" -> "9:00 AM", "13:00" -> "1:00 PM", "15:15" -> "3:15 PM"
 */
export function formatTimeSlot(time: string): string {
  const [hourStr, minute] = time.slice(0, 5).split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

/**
 * Creates a time slot label from start and end times in 12hr format
 * Example: "09:00", "10:00" -> "9:00 AM - 10:00 AM"
 */
export function createTimeSlotLabel(startTime: string, endTime: string): string {
  return `${formatTimeSlot(startTime)} - ${formatTimeSlot(endTime)}`;
}

/**
 * Returns the display label for a semester number.
 * Semesters 3-8 are mapped to their renamed labels:
 *   3 → Sem 4 (A), 4 → Sem 4 (B)
 *   5 → Sem 6 (A), 6 → Sem 6 (B)
 *   7 → Sem 8 (A), 8 → Sem 8 (B)
 * Semesters 1-2 display as "Sem 1" / "Sem 2".
 */
const SEMESTER_LABELS: Record<number, string> = {
  1: "Sem 1",
  2: "Sem 2",
  3: "Sem 4 (A)",
  4: "Sem 4 (B)",
  5: "Sem 6 (A)",
  6: "Sem 6 (B)",
  7: "Sem 8 (A)",
  8: "Sem 8 (B)",
};

export function getSemesterLabel(semester: number): string {
  return SEMESTER_LABELS[semester] ?? `Sem ${semester}`;
}
