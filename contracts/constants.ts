export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiration)
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;

export const CAMPAIGN_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
