/**
 * Schedule Utilities for General Blocking Module
 * Provides functions for schedule activation logic, domain matching, and keyword matching
 */

import { BlockingSchedule, TimePeriod } from '../types/settings';

// ==================== TIME & DAY MATCHING ====================

/**
 * Checks if the current time falls within a time period
 * Handles periods that cross midnight (e.g., 22:00 - 02:00)
 *
 * @param period - Time period to check
 * @param now - Current date (defaults to now)
 * @returns True if current time is within the period
 */
export function isTimeInPeriod(period: TimePeriod, now: Date = new Date()): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = period.startTime.split(':').map(Number);
  const [endHour, endMin] = period.endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle periods that cross midnight
  if (endMinutes < startMinutes) {
    // Period crosses midnight (e.g., 22:00 - 02:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Normal period within same day
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Checks if a schedule is currently active based on day and time
 * A schedule is active when:
 * 1. Schedule is enabled
 * 2. Current day matches one of the schedule's selected days
 * 3. Current time falls within at least one active time period
 *
 * @param schedule - Schedule to check
 * @param now - Current date (defaults to now)
 * @returns True if schedule is currently active
 */
export function isScheduleActive(schedule: BlockingSchedule, now: Date = new Date()): boolean {
  // Check if schedule is enabled
  if (!schedule.enabled) {
    return false;
  }

  // Check if current day is in selected days
  const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  if (!schedule.days.includes(currentDay)) {
    return false;
  }

  // Check if current time is in any active period
  return schedule.timePeriods.some((period) => isTimeInPeriod(period, now));
}

/**
 * Returns all currently active schedules from a list
 *
 * @param schedules - Array of schedules to filter
 * @param now - Current date (defaults to now)
 * @returns Array of currently active schedules
 */
export function getActiveSchedules(
  schedules: BlockingSchedule[],
  now: Date = new Date()
): BlockingSchedule[] {
  return schedules.filter((schedule) => isScheduleActive(schedule, now));
}

// ==================== DOMAIN MATCHING ====================

/**
 * Normalizes a domain input by removing protocols, paths, and www prefix
 * Examples:
 *   "https://www.example.com/path" → "example.com"
 *   "http://subdomain.example.com" → "subdomain.example.com"
 *   "example.com" → "example.com"
 *   "www.example.com" → "example.com"
 *
 * @param input - Domain string to normalize
 * @returns Normalized domain
 */
export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');

  // Remove path and query params
  domain = domain.split('/')[0].split('?')[0];

  // Remove www prefix
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }

  return domain;
}

/**
 * Checks if a URL's hostname matches a blocked domain or any of its subdomains
 * Examples:
 *   matchesDomain("https://ge.globo.com/path", "globo.com") → true
 *   matchesDomain("https://www.example.com", "example.com") → true
 *   matchesDomain("https://notexample.com", "example.com") → false
 *
 * @param url - URL to check
 * @param blockedDomain - Domain pattern to match against
 * @returns True if URL hostname matches the domain or is a subdomain
 */
export function matchesDomain(url: string, blockedDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const normalizedBlockedDomain = normalizeDomain(blockedDomain);

    // Exact match
    if (hostname === normalizedBlockedDomain) {
      return true;
    }

    // Subdomain match (e.g., "ge.globo.com" matches "globo.com")
    if (hostname.endsWith(`.${normalizedBlockedDomain}`)) {
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Invalid URL for domain matching:', url, error);
    return false;
  }
}

/**
 * Checks if a URL matches any blocked domain in the list
 *
 * @param url - URL to check
 * @param blockedDomains - List of blocked domains
 * @returns True if URL matches any blocked domain
 */
export function matchesAnyDomain(url: string, blockedDomains: string[]): boolean {
  return blockedDomains.some((domain) => matchesDomain(url, domain));
}

// ==================== KEYWORD MATCHING ====================

/**
 * Checks if a URL contains any of the specified keywords (case-insensitive)
 *
 * @param url - URL to check
 * @param keywords - Array of keywords to search for
 * @returns Matching keyword if found, null otherwise
 */
export function matchesUrlKeyword(url: string, keywords: string[]): string | null {
  const lowerUrl = url.toLowerCase();

  for (const keyword of keywords) {
    if (lowerUrl.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  return null;
}

/**
 * Checks if page content contains any of the specified keywords (case-insensitive)
 * Searches in the document body's visible text content
 *
 * @param keywords - Array of keywords to search for
 * @param document - Document object to search in (defaults to window.document)
 * @returns Matching keyword if found, null otherwise
 */
export function matchesContentKeyword(
  keywords: string[],
  document: Document = window.document
): string | null {
  // Get visible text content from the page
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  for (const keyword of keywords) {
    if (bodyText.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  return null;
}

// ==================== SCHEDULE MATCHING ====================

/**
 * Block reason returned when a page should be blocked
 */
export interface BlockReason {
  /** The schedule that triggered the block */
  schedule: BlockingSchedule;
  /** Type of match that triggered the block */
  matchType: 'domain' | 'url_keyword' | 'content_keyword';
  /** Specific matched value (domain name or keyword) */
  matchedValue: string;
}

/**
 * Checks if a URL should be blocked by any active schedule
 * Returns the first matching block reason, or null if not blocked
 *
 * @param url - URL to check
 * @param schedules - Array of all schedules
 * @param document - Optional document for content keyword matching
 * @returns Block reason if blocked, null otherwise
 */
export function shouldBlockPage(
  url: string,
  schedules: BlockingSchedule[],
  document?: Document
): BlockReason | null {
  // Get currently active schedules
  const activeSchedules = getActiveSchedules(schedules);

  if (activeSchedules.length === 0) {
    return null;
  }

  // Check each active schedule
  for (const schedule of activeSchedules) {
    // Check domain blocking
    if (schedule.blockedDomains.length > 0) {
      if (matchesAnyDomain(url, schedule.blockedDomains)) {
        // Find which specific domain matched
        const matchedDomain = schedule.blockedDomains.find((domain) => matchesDomain(url, domain));

        return {
          schedule,
          matchType: 'domain',
          matchedValue: matchedDomain || schedule.blockedDomains[0],
        };
      }
    }

    // Check URL keywords
    if (schedule.urlKeywords.length > 0) {
      const matchedKeyword = matchesUrlKeyword(url, schedule.urlKeywords);
      if (matchedKeyword) {
        return {
          schedule,
          matchType: 'url_keyword',
          matchedValue: matchedKeyword,
        };
      }
    }

    // Check content keywords (only if document is provided)
    if (document && schedule.contentKeywords.length > 0) {
      const matchedKeyword = matchesContentKeyword(schedule.contentKeywords, document);
      if (matchedKeyword) {
        return {
          schedule,
          matchType: 'content_keyword',
          matchedValue: matchedKeyword,
        };
      }
    }
  }

  return null;
}

// ==================== SCHEDULE HELPERS ====================

/**
 * Generates a unique ID for a schedule
 *
 * @returns Unique schedule ID
 */
export function generateScheduleId(): string {
  return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates a time string in HH:MM format
 *
 * @param time - Time string to validate
 * @returns True if valid 24-hour time format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validates a time period
 *
 * @param period - Time period to validate
 * @returns True if period is valid
 */
export function isValidTimePeriod(period: TimePeriod): boolean {
  return (
    isValidTimeFormat(period.startTime) &&
    isValidTimeFormat(period.endTime) &&
    period.startTime !== period.endTime
  );
}

/**
 * Converts time string to minutes since midnight for comparison
 * Example: "09:30" -> 570 minutes
 *
 * @param time - Time string in HH:MM format
 * @returns Minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if two time periods overlap
 * Handles periods that cross midnight
 *
 * @param period1 - First time period
 * @param period2 - Second time period
 * @returns True if periods overlap
 */
export function doPeriodsOverlap(period1: TimePeriod, period2: TimePeriod): boolean {
  const start1 = timeToMinutes(period1.startTime);
  const end1 = timeToMinutes(period1.endTime);
  const start2 = timeToMinutes(period2.startTime);
  const end2 = timeToMinutes(period2.endTime);

  // Handle periods that cross midnight
  const crosses1 = end1 < start1;
  const crosses2 = end2 < start2;

  if (crosses1 && crosses2) {
    // Both cross midnight - they always overlap
    return true;
  }

  if (crosses1) {
    // Period 1 crosses midnight: [start1..23:59] or [00:00..end1]
    // Overlaps if period 2 starts before end1 OR ends after start1
    return start2 < end1 || end2 > start1 || (start2 >= start1 && end2 <= 1440);
  }

  if (crosses2) {
    // Period 2 crosses midnight: [start2..23:59] or [00:00..end2]
    // Overlaps if period 1 starts before end2 OR ends after start2
    return start1 < end2 || end1 > start2 || (start1 >= start2 && end1 <= 1440);
  }

  // Normal case - neither crosses midnight
  // Overlap if: start1 < end2 AND end1 > start2
  return start1 < end2 && end1 > start2;
}

/**
 * Finds all overlapping time periods in a list
 * Returns array of tuples [index1, index2] for each overlapping pair
 *
 * @param periods - Array of time periods
 * @returns Array of index pairs that overlap
 */
export function findOverlappingPeriods(periods: TimePeriod[]): [number, number][] {
  const overlaps: [number, number][] = [];

  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      if (doPeriodsOverlap(periods[i], periods[j])) {
        overlaps.push([i, j]);
      }
    }
  }

  return overlaps;
}

/**
 * Gets all period indices that have overlaps
 *
 * @param periods - Array of time periods
 * @returns Set of indices that have overlaps
 */
export function getOverlappingIndices(periods: TimePeriod[]): Set<number> {
  const overlaps = findOverlappingPeriods(periods);
  const indices = new Set<number>();

  for (const [i, j] of overlaps) {
    indices.add(i);
    indices.add(j);
  }

  return indices;
}

/**
 * Validates a schedule
 *
 * @param schedule - Schedule to validate
 * @returns True if schedule is valid
 */
export function isValidSchedule(schedule: BlockingSchedule): boolean {
  // Name must not be empty
  if (!schedule.name || schedule.name.trim().length === 0) {
    return false;
  }

  // Must have at least one day selected
  if (schedule.days.length === 0) {
    return false;
  }

  // Days must be valid (0-6)
  if (schedule.days.some((day) => day < 0 || day > 6)) {
    return false;
  }

  // Must have at least one time period
  if (schedule.timePeriods.length === 0) {
    return false;
  }

  // All time periods must be valid
  if (!schedule.timePeriods.every(isValidTimePeriod)) {
    return false;
  }

  // Must have at least one blocking rule
  const hasBlockingRule =
    schedule.blockedDomains.length > 0 ||
    schedule.urlKeywords.length > 0 ||
    schedule.contentKeywords.length > 0;

  if (!hasBlockingRule) {
    return false;
  }

  return true;
}

/**
 * Formats a time period as a human-readable string
 * Example: "09:00 - 17:00"
 *
 * @param period - Time period to format
 * @returns Formatted string
 */
export function formatTimePeriod(period: TimePeriod): string {
  return `${period.startTime} - ${period.endTime}`;
}

/**
 * Gets the day name from a day number
 *
 * @param day - Day number (0-6, where 0 = Sunday)
 * @returns Day name
 */
export function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Formats selected days as a human-readable string
 * Examples:
 *   [1, 2, 3, 4, 5] → "Weekdays"
 *   [0, 6] → "Weekend"
 *   [1, 3, 5] → "Mon, Wed, Fri"
 *
 * @param days - Array of day numbers
 * @returns Formatted string
 */
export function formatDays(days: number[]): string {
  const sortedDays = [...days].sort((a, b) => a - b);

  // Check for weekdays (Mon-Fri)
  const weekdays = [1, 2, 3, 4, 5];
  if (sortedDays.length === 5 && sortedDays.every((day, index) => day === weekdays[index])) {
    return 'Weekdays';
  }

  // Check for weekend (Sat-Sun)
  const weekend = [0, 6];
  if (sortedDays.length === 2 && sortedDays.every((day, index) => day === weekend[index])) {
    return 'Weekend';
  }

  // Check for all days
  if (sortedDays.length === 7) {
    return 'Every day';
  }

  // Format as short day names
  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return sortedDays.map((day) => dayAbbreviations[day]).join(', ');
}
