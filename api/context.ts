import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import * as cookie from "cookie";
import { authenticateRequest } from "./kimi/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const { user, refreshedToken } = await authenticateRequest(opts.req.headers);
    ctx.user = user;
    
    // Sliding session: set refreshed cookie on every authenticated request
    if (refreshedToken) {
      const { getSessionCookieOptions } = await import("./lib/cookies");
      const { Session } = await import("@contracts/constants");
      const cookieOpts = getSessionCookieOptions(opts.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, refreshedToken, {
          httpOnly: cookieOpts.httpOnly,
          path: cookieOpts.path,
          sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "none",
          secure: cookieOpts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );
    }
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
