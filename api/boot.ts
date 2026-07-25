import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createProviderOAuthCallbackHandler, PKCE_COOKIE_NAME, PKCE_MAX_AGE } from "./oauth/callback";
import { getOAuthProviders } from "./oauth/providers";
import { setCookie } from "hono/cookie";
import { checkRateLimit } from "./lib/rate-limit";
import { getDb } from "./queries/connection";
import { neighborhoods } from "@db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use(cors({ 
  origin: env.corsOrigin.length > 0 ? env.corsOrigin : ["http://localhost:5173", "http://localhost:3000"], 
  credentials: true 
}));

// Google OAuth redirect
app.get("/api/oauth/google", (c) => {
  // Rate limit: max 10 OAuth initiations per IP per hour
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.raw.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip, 10)) {
    return c.json({ error: "Rate limit exceeded. Please try again later." }, 429);
  }

  // For localhost dev, always use http (not https) to match Google Console settings
  const isLocalhost = c.req.header('host')?.includes('localhost');
  const origin = isLocalhost 
    ? `http://localhost:${c.req.header('host')?.split(':')[1] || '3005'}`
    : new URL(c.req.url).origin;
  const redirectUri = `${origin}/api/oauth/callback/google`;

  // Validate redirectUri against allowlist
  const allowedOrigins = env.corsOrigin.length > 0 
    ? env.corsOrigin 
    : ["http://localhost:5173", "http://localhost:3000", "http://localhost:3005"];
  const isAllowedOrigin = allowedOrigins.some(o => origin.startsWith(o.replace(/\/api\/oauth\/callback\/google$/, '')));
  if (!isAllowedOrigin && !isLocalhost) {
    return c.json({ error: "Invalid origin" }, 400);
  }

  // Generate CSRF nonce and encode redirectUri + nonce into state
  const nonce = crypto.randomUUID();
  const statePayload = JSON.stringify({ redirectUri, nonce });
  const state = btoa(statePayload);

  const providers = getOAuthProviders();
  const config = providers.google;
  if (!config || !config.enabled) {
    return c.json({ error: "Google OAuth is not enabled" }, 400);
  }
  const { url, codeVerifier } = config.authorizeUrl(redirectUri, state);
  
  // Store code verifier + nonce in cookie for callback validation
  const isSecure = origin.startsWith('https://');
  const cookieValue = JSON.stringify({ codeVerifier, nonce });
  setCookie(c, PKCE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    path: "/",
    sameSite: isSecure ? "None" : "Lax",
    secure: isSecure,
    maxAge: PKCE_MAX_AGE,
  });
  
  return c.redirect(url, 302);
});

// Google OAuth callback
app.get("/api/oauth/callback/google", createProviderOAuthCallbackHandler("google"));

// Public sitemap and robots.txt
app.get("/sitemap.xml", async (c) => {
  const baseUrl = (env.siteUrl || new URL(c.req.url).origin).replace(/\/$/, "");
  const db = getDb();

  const neighborhoodRows = await db
    .select({ slug: neighborhoods.slug })
    .from(neighborhoods)
    .where(eq(neighborhoods.isActive, true));

  const staticUrls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${baseUrl}/leaderboard`, priority: "0.8", changefreq: "weekly" },
  ];

  const dynamicUrls = neighborhoodRows.map((n) => ({
    loc: `${baseUrl}/neighborhood/${encodeXml(n.slug)}`,
    priority: "0.7",
    changefreq: "weekly",
  }));

  const urls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${encodeXml(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return c.text(xml, 200, { "Content-Type": "application/xml" });
});

app.get("/robots.txt", (c) => {
  const baseUrl = (env.siteUrl || new URL(c.req.url).origin).replace(/\/$/, "");
  const robots = `User-agent: *
Disallow: /admin
Disallow: /profile
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  return c.text(robots, 200, { "Content-Type": "text/plain" });
});

function encodeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// tRPC API
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
