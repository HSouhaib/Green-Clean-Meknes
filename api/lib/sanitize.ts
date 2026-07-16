/**
 * Shared input sanitization utilities for backend routers.
 * Removes XSS vectors and truncates to safe lengths.
 */

export function sanitizeString(input: string, maxLength: number): string {
  return input
    .replace(/[<>]/g, "") // Remove < and > to prevent XSS
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>,;]/g, "")
    .slice(0, 320);
}
