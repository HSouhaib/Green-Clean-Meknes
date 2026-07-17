import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  createTestDb,
  createTestUser,
  createTestContext,
  seedTestData,
} from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { authRouter } from "./auth-router";
import { userRouter } from "./user-router";
import { settingsRouter } from "./settings-router";
import { signTwoFactorPendingToken } from "./kimi/session";
import { encryptSecret, generateSecret } from "./lib/totp";
import * as OTPAuth from "otpauth";
import { Session } from "@contracts/constants";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";

function uniqueUnionId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function generateCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.generate();
}

async function createPendingContext(unionId: string) {
  const token = await signTwoFactorPendingToken({
    unionId,
    clientId: "test_app",
    twoFactorPending: true,
  });
  return createTestContext(undefined, {
    headers: {
      cookie: `${Session.pendingTwoFactorCookieName}=${token}`,
    },
  });
}

function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

describe("two-factor authentication", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  describe("setup and enable", () => {
    it("returns a secret and QR code on setup", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = authRouter.createCaller(createTestContext(user));

      const result = await caller.setupTwoFactor();

      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.provisioningUri).toContain("otpauth://totp/");
    });

    it("enables 2FA with a valid verification code", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = authRouter.createCaller(createTestContext(user));

      const setup = await caller.setupTwoFactor();
      const code = generateCode(setup.secret);

      const result = await caller.enableTwoFactor({
        secret: setup.secret,
        code,
      });

      expect(result.success).toBe(true);
      expect(result.backupCodes.length).toBe(8);

      const [updated] = await testDb.db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      expect(updated.twoFactorEnabled).toBe(true);
      expect(updated.twoFactorSecret).toBeDefined();
      expect(updated.twoFactorBackupCodes).toBeDefined();
    });

    it("rejects enabling with an invalid code", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = authRouter.createCaller(createTestContext(user));

      const setup = await caller.setupTwoFactor();

      await expect(
        caller.enableTwoFactor({ secret: setup.secret, code: "000000" })
      ).rejects.toThrow("Invalid verification code");
    });
  });

  describe("verify during login", () => {
    it("issues a full session after a valid TOTP code", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const ctx = await createPendingContext(user.unionId);
      const caller = authRouter.createCaller(ctx);
      const code = generateCode(secret);

      const result = await caller.verifyTwoFactor({ code });

      expect(result.success).toBe(true);
      const setCookie = ctx.resHeaders.get("set-cookie");
      expect(setCookie).toContain(Session.cookieName);
      expect(setCookie).toContain(`${Session.pendingTwoFactorCookieName}=;`);
    });

    it("rejects an invalid TOTP code", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const ctx = await createPendingContext(user.unionId);
      const caller = authRouter.createCaller(ctx);

      await expect(caller.verifyTwoFactor({ code: "000000" })).rejects.toThrow(
        "Invalid verification code"
      );
    });

    it("rejects when pending token is missing", async () => {
      const caller = authRouter.createCaller(createTestContext());

      await expect(caller.verifyTwoFactor({ code: "000000" })).rejects.toThrow(
        "Two-factor session expired"
      );
    });
  });

  describe("backup codes", () => {
    it("verifies a valid backup code and consumes it", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const backupCode = "A1B2C3D4";
      const hashed = hashBackupCode(backupCode);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([hashed]),
      });

      const ctx = await createPendingContext(user.unionId);
      const caller = authRouter.createCaller(ctx);

      const result = await caller.verifyTwoFactorBackup({ code: backupCode });

      expect(result.success).toBe(true);

      const [updated] = await testDb.db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      expect(JSON.parse(updated.twoFactorBackupCodes || "[]")).toHaveLength(0);
    });

    it("rejects a used backup code", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const ctx = await createPendingContext(user.unionId);
      const caller = authRouter.createCaller(ctx);

      await expect(
        caller.verifyTwoFactorBackup({ code: "A1B2C3D4" })
      ).rejects.toThrow("Invalid backup code");
    });
  });

  describe("disable", () => {
    it("disables 2FA with a valid code", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const caller = authRouter.createCaller(createTestContext(user));
      const code = generateCode(secret);

      const result = await caller.disableTwoFactor({ code });

      expect(result.success).toBe(true);

      const [updated] = await testDb.db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      expect(updated.twoFactorEnabled).toBe(false);
      expect(updated.twoFactorSecret).toBeNull();
    });

    it("rejects disabling with an invalid code", async () => {
      const secret = generateSecret();
      const encrypted = encryptSecret(secret);
      const user = createTestUser(testDb.db, {
        role: "user",
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const caller = authRouter.createCaller(createTestContext(user));

      await expect(caller.disableTwoFactor({ code: "000000" })).rejects.toThrow(
        "Invalid verification code"
      );
    });
  });

  describe("admin reset", () => {
    it("allows an admin to reset 2FA for another user", async () => {
      const admin = createTestUser(testDb.db, {
        role: "admin",
        unionId: uniqueUnionId("admin"),
      });
      const target = createTestUser(testDb.db, {
        role: "user",
        unionId: uniqueUnionId("target"),
        twoFactorEnabled: true,
        twoFactorSecret: encryptSecret(generateSecret()),
        twoFactorBackupCodes: JSON.stringify([]),
      });

      const caller = userRouter.createCaller(createTestContext(admin));
      const result = await caller.resetTwoFactor({ id: target.id });

      expect(result.success).toBe(true);

      const [updated] = await testDb.db
        .select()
        .from(users)
        .where(eq(users.id, target.id))
        .limit(1);
      expect(updated.twoFactorEnabled).toBe(false);
      expect(updated.twoFactorSecret).toBeNull();
    });

    it("rejects non-admin reset attempts", async () => {
      const regular = createTestUser(testDb.db, {
        role: "user",
        unionId: uniqueUnionId("regular"),
      });
      const target = createTestUser(testDb.db, {
        role: "user",
        unionId: uniqueUnionId("target"),
        twoFactorEnabled: true,
        twoFactorSecret: encryptSecret(generateSecret()),
      });

      const caller = userRouter.createCaller(createTestContext(regular));

      await expect(caller.resetTwoFactor({ id: target.id })).rejects.toThrow(
        "Insufficient permissions"
      );
    });
  });

  describe("protected admin actions", () => {
    it("blocks admin actions when 2FA is enabled but not verified", async () => {
      const admin = createTestUser(testDb.db, {
        role: "admin",
        unionId: uniqueUnionId("admin"),
        twoFactorEnabled: true,
        twoFactorSecret: encryptSecret(generateSecret()),
      });

      const ctx = createTestContext(admin);
      ctx.twoFactorRequired = true;
      const caller = settingsRouter.createCaller(ctx);

      await expect(
        caller.update({ key: "contact_email", value: "x@example.com" })
      ).rejects.toThrow("Two-factor authentication required");
    });
  });
});
