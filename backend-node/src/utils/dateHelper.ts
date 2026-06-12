/**
 * Date/time helpers for conservation tracking
 */

/**
 * Calculate the number of full years between two dates.
 * Used for "last seen X years ago" display.
 */
export function yearsBetween(from: Date, to: Date = new Date()): number {
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  return Math.floor((to.getTime() - from.getTime()) / msPerYear);
}

/**
 * Format a years-since-seen value into a human-readable conservation string.
 * e.g. 12 → "Last recorded 12 years ago"
 *      0  → "Last recorded this year"
 *      1  → "Last recorded 1 year ago"
 */
export function formatYearsSinceSeen(years: number): string {
  if (years === 0) return 'Last recorded this year';
  if (years === 1) return 'Last recorded 1 year ago';
  return `Last recorded ${years} years ago`;
}

/**
 * Format a date to ISO date string (YYYY-MM-DD)
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate years between first and latest sighting.
 */
export function trackingDurationYears(firstSighting: Date, latestSighting: Date): number {
  return yearsBetween(firstSighting, latestSighting);
}
