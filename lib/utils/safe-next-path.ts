/**
 * Prevents open redirects after login. Only same-origin relative paths are allowed.
 */
export function safeNextPath(
  next: string | undefined,
  fallback: string
): string {
  if (!next || typeof next !== "string") {
    return fallback;
  }

  const trimmed = next.trim();

  // Must be a relative path: leading slash, not protocol-relative //, not backslash tricks.
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://")
  ) {
    return fallback;
  }

  return trimmed;
}
