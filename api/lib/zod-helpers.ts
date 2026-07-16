import { z } from "zod";
import { sanitizeString } from "./sanitize";

export function sanitizedString(maxLength: number) {
  return z.string().max(maxLength).transform((s) => sanitizeString(s, maxLength));
}

export function sanitizedStringOptional(maxLength: number) {
  return z.string().max(maxLength).optional().transform((s) => s ? sanitizeString(s, maxLength) : undefined);
}

export function safeUrl(maxLength: number) {
  return z.string().max(maxLength).refine(
    (url) => url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/"),
    { message: "URL must use HTTP, HTTPS, or be a relative path" }
  );
}
