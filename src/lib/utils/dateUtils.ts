/**
 * Date and time utility functions
 * Centralized date operations to reduce code duplication
 */

/**
 * Calculates the difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates (absolute value)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.abs(Math.floor((utc2 - utc1) / msPerDay));
}

/**
 * Calculates the difference in months between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of months between dates
 */
export function monthsBetween(date1: Date, date2: Date): number {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

/**
 * Calculates the difference in years between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of years between dates (with decimals)
 */
export function yearsBetween(date1: Date, date2: Date): number {
  return (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Adds days to a date
 * @param date - Starting date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adds years to a date
 * @param date - Starting date
 * @param years - Number of years to add
 * @returns New date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Formats a date as YYYY-MM-DD
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date as relative time (e.g., "2 days ago", "3 months ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
}

/**
 * Checks if a date is within a specified number of days from now
 * @param date - Date to check
 * @param days - Number of days
 * @returns True if date is within the specified days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffDays = daysBetween(now, date);
  return diffDays <= days;
}

/**
 * Gets the start of day (00:00:00) for a date
 * @param date - Input date
 * @returns Date at start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of day (23:59:59) for a date
 * @param date - Input date
 * @returns Date at end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Parses ISO date string to Date object
 * @param isoString - ISO 8601 date string
 * @returns Date object or null if invalid
 */
export function parseISODate(isoString: string): Date | null {
  try {
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Gets current timestamp in seconds
 * @returns Current Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Converts timestamp to Date object
 * @param timestamp - Unix timestamp (seconds)
 * @returns Date object
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}
