import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

function list(name: string): string[] {
  const value = process.env[name];
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export const env = {
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === "true",
  databaseUrl: required("DATABASE_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  // CORS
  corsOrigin: list("CORS_ORIGIN"),

  // Public site URL for sitemaps / canonical links
  siteUrl: optional("SITE_URL"),

  // Google OAuth
  googleClientId: optional("GOOGLE_CLIENT_ID"),
  googleClientSecret: optional("GOOGLE_CLIENT_SECRET"),

  // GreenMeknes OAuth (legacy/optional)
  appId: optional("GREENMEKNES_APP_ID"),
  greenmeknesAuthUrl: optional("GREENMEKNES_AUTH_URL"),
  greenmeknesOpenUrl: optional("GREENMEKNES_OPEN_URL"),
};
