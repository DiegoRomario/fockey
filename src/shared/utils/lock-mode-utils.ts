/**
 * Lock Mode utility functions
 * Provides time calculations and formatting for Lock Mode UI
 */

/**
 * Time unit enum for duration input
 */
export enum TimeUnit {
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
}

/**
 * Convert duration value and unit to milliseconds
 *
 * @param value - Duration value (number)
 * @param unit - Time unit (minutes, hours, days)
 * @returns Duration in milliseconds
 */
export function durationToMs(value: number, unit: TimeUnit): number {
  switch (unit) {
    case TimeUnit.Minutes:
      return value * 60 * 1000;
    case TimeUnit.Hours:
      return value * 60 * 60 * 1000;
    case TimeUnit.Days:
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Format remaining time as human-readable countdown
 *
 * Formats:
 * - Less than 1 hour: "23m 45s"
 * - 1-24 hours: "9h 23m"
 * - More than 24 hours: "2d 5h"
 *
 * @param remainingMs - Remaining time in milliseconds
 * @returns Formatted countdown string
 */
export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    // More than 24 hours: "2d 5h"
    const hours = totalHours % 24;
    return `${totalDays}d${hours > 0 ? ` ${hours}h` : ''}`;
  } else if (totalHours > 0) {
    // 1-24 hours: "9h 23m"
    const minutes = totalMinutes % 60;
    return `${totalHours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  } else {
    // Less than 1 hour: "23m 45s"
    const minutes = totalMinutes;
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
    } else {
      return `${seconds}s`;
    }
  }
}

/**
 * Format duration in milliseconds as human-readable string
 * Used for displaying lock activation duration
 *
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2 hours", "30 minutes", "1 day")
 */
export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / (60 * 1000));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    return `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
  } else if (totalHours > 0) {
    return `${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
  } else {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Format Unix timestamp as human-readable date/time
 * Used for displaying lock expiration time
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date/time string (e.g., "Dec 26, 2025 10:30 PM")
 */
export function formatExpirationTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Validate duration input
 *
 * @param value - Duration value to validate
 * @param unit - Time unit
 * @returns Validation error message, or null if valid
 */
export function validateDuration(value: number, unit: TimeUnit): string | null {
  if (!value || value <= 0) {
    return 'Duration must be greater than 0';
  }

  // Minimum: 1 minute
  const minMs = 60 * 1000;
  const durationMs = durationToMs(value, unit);

  if (durationMs < minMs) {
    return 'Minimum lock duration is 1 minute';
  }

  // Maximum: 365 days
  const maxMs = 365 * 24 * 60 * 60 * 1000;
  if (durationMs > maxMs) {
    return 'Maximum lock duration is 365 days';
  }

  return null;
}

/**
 * Calculate remaining time from lock end time
 *
 * @param lockEndTime - Unix timestamp when lock expires
 * @returns Remaining time in milliseconds (0 if expired)
 */
export function calculateRemainingTime(lockEndTime: number): number {
  const now = Date.now();
  const remaining = lockEndTime - now;
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if countdown should show warning color
 * Returns true when less than 1 hour remaining
 *
 * @param remainingMs - Remaining time in milliseconds
 * @returns True if warning color should be shown
 */
export function shouldShowWarning(remainingMs: number): boolean {
  const oneHour = 60 * 60 * 1000;
  return remainingMs > 0 && remainingMs < oneHour;
}
