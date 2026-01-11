/**
 * Domain Utilities
 * Provides domain validation and normalization functions for blocking features
 */

/**
 * Validates if a string is a valid domain pattern
 * Accepts wildcards (*.example.com) and standard domains (example.com)
 *
 * @param domain - Domain pattern to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * isValidDomainPattern('example.com')      // true
 * isValidDomainPattern('*.example.com')    // true
 * isValidDomainPattern('*')                // false (too broad)
 * isValidDomainPattern('facebook')         // false (no TLD)
 */
export function isValidDomainPattern(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  const trimmed = domain.trim();

  // Reject empty or whitespace-only strings
  if (!trimmed) {
    return false;
  }

  // Reject wildcard-only patterns (too broad)
  if (trimmed === '*' || trimmed === '*.' || trimmed === '.*') {
    return false;
  }

  // Check for valid domain structure
  // Must contain at least one dot (for TLD)
  if (!trimmed.includes('.')) {
    return false;
  }

  // Allow wildcard patterns (*.example.com, *.*.example.com)
  // Remove wildcards for validation
  const withoutWildcards = trimmed.replace(/\*\./g, '');

  // Validate remaining domain part
  // Basic domain regex: alphanumeric, hyphens, dots
  const domainRegex =
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

  return domainRegex.test(withoutWildcards);
}

/**
 * Normalizes a domain input by extracting the hostname and removing protocol, path, and www prefix
 *
 * @param input - Domain, URL, or domain pattern to normalize
 * @returns Normalized domain in lowercase
 *
 * @example
 * normalizeDomain('https://www.example.com/path')  // 'example.com'
 * normalizeDomain('www.example.com')               // 'example.com'
 * normalizeDomain('Example.Com')                   // 'example.com'
 * normalizeDomain('*.example.com')                 // '*.example.com'
 */
export function normalizeDomain(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let domain = input.trim().toLowerCase();

  // If it's a URL with protocol, parse it
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    try {
      const url = new URL(domain);
      domain = url.hostname;
    } catch {
      // If URL parsing fails, try to extract domain manually
      domain = domain
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .split('?')[0];
    }
  } else {
    // Remove path and query params
    domain = domain.split('/')[0].split('?')[0];
  }

  // Remove www prefix (but preserve wildcards)
  if (domain.startsWith('www.') && !domain.startsWith('*.')) {
    domain = domain.substring(4);
  }

  return domain;
}

/**
 * Checks if a domain pattern uses wildcards (*.example.com)
 *
 * @param pattern - Domain pattern to check
 * @returns True if pattern contains wildcards, false otherwise
 */
export function isWildcardPattern(pattern: string): boolean {
  return pattern.includes('*');
}

/**
 * Converts a wildcard domain pattern to a regular expression
 * Handles patterns like *.example.com or *.*.example.com
 *
 * @param pattern - Wildcard pattern to convert
 * @returns RegExp for matching hostnames
 *
 * @example
 * wildcardToRegex('*.example.com')  // /^[a-z0-9-]+\.example\.com$/i
 */
export function wildcardToRegex(pattern: string): RegExp {
  // Escape special regex characters except *
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '[a-z0-9-]+'); // Replace * with subdomain pattern

  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Checks if a hostname matches a wildcard pattern
 *
 * @param hostname - Hostname to test (e.g., "www.example.com")
 * @param pattern - Wildcard pattern (e.g., "*.example.com")
 * @returns True if hostname matches pattern, false otherwise
 */
export function matchesWildcard(hostname: string, pattern: string): boolean {
  const regex = wildcardToRegex(pattern);
  return regex.test(hostname);
}

/**
 * Checks if a URL's domain matches a blocked domain (with wildcard support)
 *
 * @param url - URL to check
 * @param blockedDomain - Domain or wildcard pattern to match against
 * @returns True if URL matches blocked domain, false otherwise
 *
 * @example
 * matchesDomain('https://www.example.com/page', 'example.com')     // true
 * matchesDomain('https://sub.example.com/page', '*.example.com')   // true
 * matchesDomain('https://www.other.com/page', 'example.com')       // false
 */
export function matchesDomain(url: string, blockedDomain: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const normalizedBlockedDomain = blockedDomain.toLowerCase();

    // Check for wildcard pattern
    if (isWildcardPattern(normalizedBlockedDomain)) {
      return matchesWildcard(hostname, normalizedBlockedDomain);
    }

    // Exact match or subdomain match
    return hostname === normalizedBlockedDomain || hostname.endsWith(`.${normalizedBlockedDomain}`);
  } catch {
    return false;
  }
}

/**
 * Checks if a URL matches any domain in a list of blocked domains
 *
 * @param url - URL to check
 * @param blockedDomains - Array of domain patterns to match against
 * @returns True if URL matches any blocked domain, false otherwise
 */
export function matchesAnyDomain(url: string, blockedDomains: string[]): boolean {
  return blockedDomains.some((domain) => matchesDomain(url, domain));
}
