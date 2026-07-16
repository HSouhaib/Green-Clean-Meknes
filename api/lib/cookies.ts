import type { CookieOptions } from "hono/utils/cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    // sameSite: "None" is required for cross-origin OAuth callbacks.
    // secure: true ensures cookies are only sent over HTTPS in production.
    // This is safe because we validate the origin via CORS and OAuth state params.
    sameSite: localhost ? "Lax" : "None",
    secure: !localhost,
  };
}
