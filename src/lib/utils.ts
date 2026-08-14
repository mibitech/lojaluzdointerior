import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse a date-only string (e.g. "2025-03-15") to avoid timezone shift.
 * Appends T12:00:00 to prevent UTC midnight from rolling back a day in negative UTC offsets.
 * For datetime strings (containing "T"), returns new Date() directly.
 */
export function parseDateSafe(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(dateStr + 'T12:00:00');
}
