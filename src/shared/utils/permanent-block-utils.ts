/**
 * Permanent Block List Utilities
 * Provides functions for managing the 24/7 block list (permanent blocking)
 */

import { PermanentBlockList } from '../types/settings';

// ==================== WILDCARD DOMAIN MATCHING ====================

/**
 * Checks if a domain pattern contains wildcards
 * Example: "*.example.com" returns true
 *
 * @param pattern - Domain pattern to check
 * @returns True if pattern contains wildcards
 */
export function isWildcardPattern(pattern: string): boolean {
  return pattern.includes('*');
}

/**
 * Converts a wildcard domain pattern to a regular expression
 * Examples:
 *   "*.example.com" → /^.*\.example\.com$/
 *   "*.*.example.com" → /^.*\..*\.example\.com$/
 *
 * @param pattern - Wildcard pattern to convert
 * @returns RegExp for matching domains
 */
export function wildcardToRegex(pattern: string): RegExp {
  // Escape special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace * with .*
  const regexPattern = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexPattern}$`, 'i'); // Case-insensitive
}

/**
 * Checks if a hostname matches a wildcard pattern
 * Examples:
 *   matchesWildcard("www.example.com", "*.example.com") → true
 *   matchesWildcard("subdomain.example.com", "*.example.com") → true
 *   matchesWildcard("example.com", "*.example.com") → false
 *   matchesWildcard("otherexample.com", "*.example.com") → false
 *
 * @param hostname - Hostname to check
 * @param pattern - Wildcard pattern
 * @returns True if hostname matches pattern
 */
export function matchesWildcard(hostname: string, pattern: string): boolean {
  const regex = wildcardToRegex(pattern);
  return regex.test(hostname);
}

// ==================== DOMAIN MATCHING WITH WILDCARD SUPPORT ====================

/**
 * Normalizes a domain input by removing protocols, paths, and www prefix
 * Examples:
 *   "https://www.example.com/path" → "example.com"
 *   "*.facebook.com" → "*.facebook.com" (preserves wildcards)
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

  // Remove www prefix (but preserve wildcards)
  if (domain.startsWith('www.') && !domain.startsWith('*.')) {
    domain = domain.substring(4);
  }

  return domain;
}

/**
 * Checks if a URL's hostname matches a blocked domain (supports wildcards)
 * Examples:
 *   matchesPermanentDomain("https://www.reddit.com", "reddit.com") → true
 *   matchesPermanentDomain("https://subdomain.example.com", "*.example.com") → true
 *   matchesPermanentDomain("https://www.facebook.com", "*.facebook.com") → true
 *
 * @param url - URL to check
 * @param blockedDomain - Domain pattern (may contain wildcards)
 * @returns True if URL hostname matches the domain pattern
 */
export function matchesPermanentDomain(url: string, blockedDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const normalizedBlockedDomain = normalizeDomain(blockedDomain);

    // Check if blocked domain is a wildcard pattern
    if (isWildcardPattern(normalizedBlockedDomain)) {
      return matchesWildcard(hostname, normalizedBlockedDomain);
    }

    // Standard exact and subdomain matching (existing logic)
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
    console.warn('Invalid URL for permanent domain matching:', url, error);
    return false;
  }
}

/**
 * Checks if a URL matches any domain in the permanent block list
 *
 * @param url - URL to check
 * @param blockedDomains - List of blocked domains (may contain wildcards)
 * @returns Matching domain if found, null otherwise
 */
export function matchesAnyPermanentDomain(url: string, blockedDomains: string[]): string | null {
  for (const domain of blockedDomains) {
    if (matchesPermanentDomain(url, domain)) {
      return domain;
    }
  }
  return null;
}

// ==================== KEYWORD MATCHING ====================

/**
 * Checks if a URL contains any of the specified keywords (case-insensitive)
 *
 * @param url - URL to check
 * @param keywords - Array of keywords to search for
 * @returns Matching keyword if found, null otherwise
 */
export function matchesPermanentUrlKeyword(url: string, keywords: string[]): string | null {
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
 *
 * @param keywords - Array of keywords to search for
 * @param document - Document object to search in
 * @returns Matching keyword if found, null otherwise
 */
export function matchesPermanentContentKeyword(
  keywords: string[],
  document: Document = window.document
): string | null {
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  for (const keyword of keywords) {
    if (bodyText.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  return null;
}

// ==================== PERMANENT BLOCK CHECKING ====================

/**
 * Block reason returned when a page should be blocked by permanent rules
 */
export interface PermanentBlockReason {
  /** Type of match that triggered the block */
  matchType: 'permanent_domain' | 'permanent_url_keyword' | 'permanent_content_keyword';
  /** Specific matched value (domain name or keyword) */
  matchedValue: string;
}

/**
 * Checks if a URL should be blocked by permanent block list
 * Returns block reason if blocked, null otherwise
 *
 * @param url - URL to check
 * @param permanentBlockList - Permanent block list to check against
 * @param document - Optional document for content keyword matching
 * @returns Block reason if blocked, null otherwise
 */
export function shouldBlockByPermanentList(
  url: string,
  permanentBlockList: PermanentBlockList,
  document?: Document
): PermanentBlockReason | null {
  // Check domain blocking (highest priority)
  if (permanentBlockList.domains.length > 0) {
    const matchedDomain = matchesAnyPermanentDomain(url, permanentBlockList.domains);
    if (matchedDomain) {
      return {
        matchType: 'permanent_domain',
        matchedValue: matchedDomain,
      };
    }
  }

  // Check URL keywords
  if (permanentBlockList.urlKeywords.length > 0) {
    const matchedKeyword = matchesPermanentUrlKeyword(url, permanentBlockList.urlKeywords);
    if (matchedKeyword) {
      return {
        matchType: 'permanent_url_keyword',
        matchedValue: matchedKeyword,
      };
    }
  }

  // Check content keywords (only if document is provided)
  if (document && permanentBlockList.contentKeywords.length > 0) {
    const matchedKeyword = matchesPermanentContentKeyword(
      permanentBlockList.contentKeywords,
      document
    );
    if (matchedKeyword) {
      return {
        matchType: 'permanent_content_keyword',
        matchedValue: matchedKeyword,
      };
    }
  }

  return null;
}

// ==================== VALIDATION ====================

/**
 * Validates a domain pattern (with or without wildcards)
 * Returns true if pattern is valid
 *
 * @param domain - Domain pattern to validate
 * @returns True if valid domain pattern
 */
export function isValidDomainPattern(domain: string): boolean {
  const normalized = normalizeDomain(domain);

  if (normalized.length === 0) {
    return false;
  }

  // Check for valid characters (letters, numbers, dots, hyphens, wildcards)
  const validPattern = /^[a-z0-9*.-]+$/i;
  if (!validPattern.test(normalized)) {
    return false;
  }

  // Cannot start or end with a dot (except wildcards)
  if (normalized.startsWith('.') || normalized.endsWith('.')) {
    return false;
  }

  // If contains wildcard, validate wildcard usage
  if (isWildcardPattern(normalized)) {
    // Wildcard should be followed by a dot (e.g., "*.example.com")
    // Or be the entire pattern ("*") - though this is too broad
    if (normalized === '*') {
      return false; // Too broad - not allowed
    }

    // Replace wildcards with 'x' for validation
    const withoutWildcards = normalized.replace(/\*/g, 'x');
    // Must still look like a valid domain after replacement
    const domainPattern = /^[a-z0-9.-]+$/i;
    if (!domainPattern.test(withoutWildcards)) {
      return false;
    }

    // Wildcard patterns must have at least one dot
    if (!normalized.includes('.')) {
      return false;
    }
  } else {
    // Regular domains must have at least one dot (e.g., "example.com")
    // Single words like "test" are not valid domains
    if (!normalized.includes('.')) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a keyword (must be non-empty and reasonable length)
 *
 * @param keyword - Keyword to validate
 * @returns True if valid keyword
 */
export function isValidKeyword(keyword: string): boolean {
  const trimmed = keyword.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
}
