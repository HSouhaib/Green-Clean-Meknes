import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { env } from "./lib/env";
import { upsertUser } from "./queries/users";

export const authRouter = createRouter({
  me: publicQuery.query(async (opts) => {
    // Return user from context if authenticated, otherwise null
    return opts.ctx.user ?? null;
  }),
  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
  myPermissions: publicQuery.query(async (opts) => {
    if (!opts.ctx.user) return [];
    const db = (await import("./queries/connection")).getDb();
    const { userRoles } = await import("@db/schema");
    const { eq } = await import("drizzle-orm");
    const [role] = await db.select().from(userRoles).where(eq(userRoles.name, opts.ctx.user.role)).limit(1);
    if (!role) return [];
    try {
      return JSON.parse(role.permissions) as string[];
    } catch {
      return [];
    }
  }),
  providers: publicQuery.query(() => {
    return [
      { key: "google" as const, name: "Google", enabled: !!env.googleClientId && !!env.googleClientSecret },
    ];
  }),

  // Dev-only: bypass Kimi OAuth for local testing (Admin)
  devLogin: publicQuery.mutation(async ({ ctx }) => {
    if (env.isProduction) {
      throw new Error("Dev login is not available in production");
    }
    const devUnionId = "dev_user_001";
    const devName = "Dev User";
    const devEmail = "dev@local.test";

    await upsertUser({
      unionId: devUnionId,
      name: devName,
      email: devEmail,
      lastSignInAt: new Date(),
    });

    // Force super_admin role for dev user
    const db = (await import("./queries/connection")).getDb();
    const { users } = await import("@db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ role: "super_admin" }).where(eq(users.unionId, devUnionId));

    const token = await signSessionToken({
      unionId: devUnionId,
      clientId: "dev_app",
    });

    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      }),
    );

    return { success: true, name: devName };
  }),

  // Dev-only: bypass OAuth as regular volunteer user
  devLoginUser: publicQuery.mutation(async ({ ctx }) => {
    if (env.isProduction) {
      throw new Error("Dev login is not available in production");
    }
    const devUnionId = "dev_user_002";
    const devName = "Local Volunteer";
    const devEmail = "dev.volunteer@local.test";

    await upsertUser({
      unionId: devUnionId,
      name: devName,
      email: devEmail,
      lastSignInAt: new Date(),
    });

    // Ensure user role (not admin)
    const db = (await import("./queries/connection")).getDb();
    const { users } = await import("@db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ role: "user" }).where(eq(users.unionId, devUnionId));

    const token = await signSessionToken({
      unionId: devUnionId,
      clientId: "dev_app",
    });

    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      }),
    );

    return { success: true, name: devName };
  }),
});
