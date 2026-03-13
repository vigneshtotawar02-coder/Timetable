import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a time string by removing leading zeros to match the TIME_SLOTS format
 * Example: "09:00" -> "9:00", "10:00" -> "10:00"
 */
export function formatTimeSlot(time: string): string {
  return time.slice(0, 5).replace(/^0/, '');
}

/**
 * Creates a time slot label from start and end times
 * Example: "09:00", "10:00" -> "9:00 - 10:00"
 */
export function createTimeSlotLabel(startTime: string, endTime: string): string {
  return `${formatTimeSlot(startTime)} - ${formatTimeSlot(endTime)}`;
}
