import type { Context } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "../kimi/session";
import { upsertUser } from "../queries/users";
import { getOAuthProviders, type OAuthProvider } from "./providers";

const PKCE_COOKIE_NAME = "oauth_pkce";
const PKCE_MAX_AGE = 600; // 10 minutes

export function createProviderOAuthCallbackHandler(provider: OAuthProvider) {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");
    
    if (error) {
      if (error === "access_denied") {
        return c.redirect("/", 302);
      }
      return c.json(
        { error, error_description: errorDescription },
        400,
      );
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    try {
      // Decode state and validate CSRF nonce
      let statePayload: { redirectUri: string; nonce: string };
      try {
        statePayload = JSON.parse(atob(state));
      } catch {
        return c.json({ error: "Invalid state parameter" }, 400);
      }
      const { redirectUri, nonce } = statePayload;

      // Retrieve and validate cookie
      const cookieRaw = getCookie(c, PKCE_COOKIE_NAME);
      if (!cookieRaw) {
        return c.json({ error: "PKCE code verifier expired or missing" }, 400);
      }
      let cookiePayload: { codeVerifier: string; nonce: string };
      try {
        cookiePayload = JSON.parse(cookieRaw);
      } catch {
        return c.json({ error: "Invalid PKCE cookie" }, 400);
      }
      const { codeVerifier, nonce: storedNonce } = cookiePayload;

      // Validate CSRF nonce matches
      if (!nonce || !storedNonce || nonce !== storedNonce) {
        return c.json({ error: "CSRF nonce mismatch" }, 400);
      }
      
      if (!codeVerifier) {
        return c.json({ error: "PKCE code verifier expired or missing" }, 400);
      }

      const providers = getOAuthProviders();
      const config = providers[provider];

      if (!config || !config.enabled) {
        return c.json({ error: `OAuth provider ${provider} is not enabled` }, 400);
      }

      // Exchange code for token
      const tokens = await config.exchangeCode(code, redirectUri, codeVerifier);

      // Get user profile
      const profile = await config.getUserProfile(tokens.accessToken);
      if (!profile) {
        throw new Error(`Failed to fetch user profile from ${provider}`);
      }

      // Create a unique unionId that includes the provider prefix
      const unionId = `${provider}:${profile.id}`;

      await upsertUser({
        unionId,
        name: profile.name,
        email: profile.email || undefined,
        avatar: profile.avatar || undefined,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({
        unionId,
        clientId: `${provider}_app`,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      
      // Clear PKCE cookie (must match the settings used when setting it)
      const isSecure = redirectUri.startsWith('https://');
      setCookie(c, PKCE_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        sameSite: isSecure ? "None" : "Lax",
        secure: isSecure,
        maxAge: 0,
      });
      
      // Set session cookie
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/", 302);
    } catch (error: any) {
      return c.json({ error: "OAuth callback failed", details: error?.message || String(error) }, 500);
    }
  };
}

export { PKCE_COOKIE_NAME, PKCE_MAX_AGE };
