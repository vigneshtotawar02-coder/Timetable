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
