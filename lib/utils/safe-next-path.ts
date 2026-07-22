/**
 * Prevents open redirects after login. Only same-origin relative paths are allowed.
 */
export function safeNextPath(
  next: string | undefined,
  fallback: string
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
