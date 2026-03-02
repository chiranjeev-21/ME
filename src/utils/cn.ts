/**
 * Lightweight className combiner.
 * Filters falsy values — no external deps required.
 *
 * @example cn(styles.base, isActive && styles.active, className)
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
