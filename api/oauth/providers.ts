import { env } from "../lib/env";
import { Google, generateCodeVerifier, generateState } from "arctic";
import { checkRateLimit } from "../lib/rate-limit";

export type OAuthProvider = "google";

interface ProviderConfig {
  name: string;
  enabled: boolean;
  authorizeUrl: (redirectUri: string, state: string) => { url: string; codeVerifier: string };
  exchangeCode: (code: string, redirectUri: string, codeVerifier: string) => Promise<{
    accessToken: string;
    refreshToken?: string;
  }>;
  getUserProfile: (accessToken: string) => Promise<{
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  } | null>;
}

// Google OAuth client cache (keyed by redirectUri)
const googleClients = new Map<string, Google>();

function getGoogleClient(redirectUri: string): Google | null {
  if (!env.googleClientId || !env.googleClientSecret) return null;
  
  const cacheKey = redirectUri;
  let client = googleClients.get(cacheKey);
  if (!client) {
    client = new Google(
      env.googleClientId,
      env.googleClientSecret,
      redirectUri,
    );
    googleClients.set(cacheKey, client);
  }
  return client;
}

export function getOAuthProviders(): Record<OAuthProvider, ProviderConfig> {
  const providers: Record<OAuthProvider, ProviderConfig> = {
    google: {
      name: "Google",
      enabled: !!env.googleClientId && !!env.googleClientSecret,
      authorizeUrl: (redirectUri, state) => {
        const client = getGoogleClient(redirectUri);
        if (!client) throw new Error("Google OAuth not configured");
        const codeVerifier = generateCodeVerifier();
        const url = client.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
        // Request refresh token + force consent screen for consistent behavior
        url.searchParams.set("access_type", "offline");
        url.searchParams.set("prompt", "consent");
        return { url: url.toString(), codeVerifier };
      },
      exchangeCode: async (code, redirectUri, codeVerifier) => {
        const client = getGoogleClient(redirectUri);
        if (!client) throw new Error("Google OAuth not configured");
        const tokens = await client.validateAuthorizationCode(code, codeVerifier);
        return {
          accessToken: tokens.accessToken(),
          refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : undefined,
        };
      },
      getUserProfile: async (accessToken) => {
        const resp = await fetch(
          "https://openidconnect.googleapis.com/v1/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!resp.ok) return null;
        const data = (await resp.json()) as {
          sub: string;
          name: string;
          email?: string;
          picture?: string;
        };
        return {
          id: data.sub,
          name: data.name,
          email: data.email,
          avatar: data.picture,
        };
      },
    },
  };

  return providers;
}

export function getEnabledProviders(): { key: OAuthProvider; name: string }[] {
  const providers = getOAuthProviders();
  return (Object.keys(providers) as OAuthProvider[])
    .filter((k) => providers[k].enabled)
    .map((k) => ({ key: k, name: providers[k].name }));
}
