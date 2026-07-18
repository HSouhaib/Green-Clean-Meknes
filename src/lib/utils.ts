import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEventTimestamp(
  eventDate: Date | string | number | null | undefined
): number | null {
  if (!eventDate) return null;
  if (eventDate instanceof Date) return eventDate.getTime();
  if (typeof eventDate === "number") return eventDate * 1000;
  const parsed = Number(eventDate);
  return isNaN(parsed) ? null : parsed * 1000;
}

export function formatCampaignDateTime(
  eventDate: Date | string | number | null | undefined,
  lang: string,
  fallback: string
): string {
  const ts = getEventTimestamp(eventDate);
  if (!ts) return fallback;
  const locale = lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US";
  return new Date(ts).toLocaleString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCampaignTime(
  eventDate: Date | string | number | null | undefined,
  lang: string
): string {
  const ts = getEventTimestamp(eventDate);
  if (!ts) return "";
  const locale = lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US";
  return new Date(ts).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
