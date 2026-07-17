import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { signSessionToken, verifyTwoFactorPendingToken } from "./kimi/session";
import { env } from "./lib/env";
import { findUserByUnionId, upsertUser } from "./queries/users";
import {
  encryptSecret,
  generateBackupCodes,
  generateQrDataUrl,
  generateSecret,
  getProvisioningUri,
  verifyBackupCode,
  verifyCode,
} from "./lib/totp";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "./lib/rate-limit";

export const authRouter = createRouter({
  me: publicQuery.query(async opts => {
    // Return user from context if authenticated, otherwise null
    return opts.ctx.user ?? null;
  }),
  twoFactorStatus: publicQuery.query(async opts => {
    const user = opts.ctx.user;
    return {
      enabled: user?.twoFactorEnabled ?? false,
      required: opts.ctx.twoFactorRequired ?? false,
    };
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
      })
    );
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.pendingTwoFactorCookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );
    return { success: true };
  }),
  myPermissions: publicQuery.query(async opts => {
    if (!opts.ctx.user) return [];
    const db = (await import("./queries/connection")).getDb();
    const { userRoles } = await import("@db/schema");
    const { eq } = await import("drizzle-orm");
    const [role] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.name, opts.ctx.user.role))
      .limit(1);
    if (!role) return [];
    try {
      return JSON.parse(role.permissions) as string[];
    } catch {
      return [];
    }
  }),
  providers: publicQuery.query(() => {
    return [
      {
        key: "google" as const,
        name: "Google",
        enabled: !!env.googleClientId && !!env.googleClientSecret,
      },
    ];
  }),

  // Dev-only: bypass Kimi OAuth for local testing (Admin)
  devLogin: publicQuery.mutation(async ({ ctx }) => {
    if (env.isProduction || !env.allowDevLogin) {
      throw new Error("Dev login is not available");
    }
    const devUnionId = "dev_user_001";
    const devName = "Dev User";
    const devEmail = "dev@local.test";
    const clientId = "dev_app";

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
    await db
      .update(users)
      .set({ role: "super_admin" })
      .where(eq(users.unionId, devUnionId));

    const opts = getSessionCookieOptions(ctx.req.headers);
    const user = await findUserByUnionId(devUnionId);

    // Dev logins intentionally skip the 2FA challenge to keep local development fast.
    const token = await signSessionToken({
      unionId: devUnionId,
      clientId,
      twoFactorVerified: user?.twoFactorEnabled ? true : undefined,
    });

    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      })
    );

    return { success: true, name: devName };
  }),

  // Dev-only: bypass OAuth as regular volunteer user
  devLoginUser: publicQuery.mutation(async ({ ctx }) => {
    if (env.isProduction || !env.allowDevLogin) {
      throw new Error("Dev login is not available");
    }
    const devUnionId = "dev_user_002";
    const devName = "Local Volunteer";
    const devEmail = "dev.volunteer@local.test";
    const clientId = "dev_app";

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
    await db
      .update(users)
      .set({ role: "user" })
      .where(eq(users.unionId, devUnionId));

    const opts = getSessionCookieOptions(ctx.req.headers);
    const user = await findUserByUnionId(devUnionId);

    // Dev logins intentionally skip the 2FA challenge to keep local development fast.
    const token = await signSessionToken({
      unionId: devUnionId,
      clientId,
      twoFactorVerified: user?.twoFactorEnabled ? true : undefined,
    });

    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, token, {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: Session.maxAgeMs / 1000,
      })
    );

    return { success: true, name: devName };
  }),

  // Begin 2FA setup: generate a new secret and QR code for the current user.
  setupTwoFactor: authedQuery.mutation(async ({ ctx }) => {
    const user = ctx.user;
    const secret = generateSecret();
    const provisioningUri = getProvisioningUri(user, secret);
    const qrDataUrl = await generateQrDataUrl(provisioningUri);

    return {
      secret,
      provisioningUri,
      qrDataUrl,
    };
  }),

  // Enable 2FA with the secret from setup and a verification code.
  enableTwoFactor: authedQuery
    .input(z.object({ secret: z.string().min(1), code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const db = getDb();

      if (user.twoFactorEnabled) {
        throw new Error("Two-factor authentication is already enabled");
      }

      const encrypted = encryptSecret(input.secret);
      if (!verifyCode(encrypted, input.code)) {
        throw new Error("Invalid verification code");
      }

      const { plain, hashed } = generateBackupCodes();

      await db
        .update(users)
        .set({
          twoFactorSecret: encrypted,
          twoFactorEnabled: true,
          twoFactorBackupCodes: JSON.stringify(hashed),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { success: true, backupCodes: plain };
    }),

  // Disable 2FA for the current user after verifying a TOTP code.
  disableTwoFactor: authedQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const db = getDb();

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new Error("Two-factor authentication is not enabled");
      }

      if (!verifyCode(user.twoFactorSecret, input.code)) {
        throw new Error("Invalid verification code");
      }

      await db
        .update(users)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return { success: true };
    }),

  // Verify a TOTP code during a pending login and issue a full session cookie.
  verifyTwoFactor: publicQuery
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const ip =
        ctx.req.headers.get("x-forwarded-for") ||
        ctx.req.headers.get("x-real-ip") ||
        "unknown";
      if (!checkRateLimit(ip, 10)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      const cookies = cookie.parse(ctx.req.headers.get("cookie") || "");
      const pendingToken = cookies[Session.pendingTwoFactorCookieName];
      if (!pendingToken) {
        throw new Error("Two-factor session expired. Please log in again.");
      }

      const claim = await verifyTwoFactorPendingToken(pendingToken);
      if (!claim) {
        throw new Error("Two-factor session expired. Please log in again.");
      }

      const user = await findUserByUnionId(claim.unionId);
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new Error(
          "Two-factor authentication is not enabled for this account"
        );
      }

      if (!verifyCode(user.twoFactorSecret, input.code)) {
        throw new Error("Invalid verification code");
      }

      const token = await signSessionToken({
        unionId: claim.unionId,
        clientId: claim.clientId,
        twoFactorVerified: true,
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
        })
      );
      // Clear the pending 2FA cookie
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.pendingTwoFactorCookieName, "", {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: 0,
        })
      );

      return { success: true };
    }),

  // Verify a backup code during a pending login and issue a full session cookie.
  verifyTwoFactorBackup: publicQuery
    .input(z.object({ code: z.string().min(8).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const ip =
        ctx.req.headers.get("x-forwarded-for") ||
        ctx.req.headers.get("x-real-ip") ||
        "unknown";
      if (!checkRateLimit(ip, 10)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      const cookies = cookie.parse(ctx.req.headers.get("cookie") || "");
      const pendingToken = cookies[Session.pendingTwoFactorCookieName];
      if (!pendingToken) {
        throw new Error("Two-factor session expired. Please log in again.");
      }

      const claim = await verifyTwoFactorPendingToken(pendingToken);
      if (!claim) {
        throw new Error("Two-factor session expired. Please log in again.");
      }

      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.unionId, claim.unionId))
        .limit(1);
      if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
        throw new Error("Two-factor backup codes are not available");
      }

      const hashedCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
      const { valid, remaining } = verifyBackupCode(input.code, hashedCodes);
      if (!valid) {
        throw new Error("Invalid backup code");
      }

      await db
        .update(users)
        .set({
          twoFactorBackupCodes: JSON.stringify(remaining),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const token = await signSessionToken({
        unionId: claim.unionId,
        clientId: claim.clientId,
        twoFactorVerified: true,
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
        })
      );
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.pendingTwoFactorCookieName, "", {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: 0,
        })
      );

      return { success: true };
    }),
});
