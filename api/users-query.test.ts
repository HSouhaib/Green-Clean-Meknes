import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { createTestDb } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { upsertUser, findUserByUnionId } from "./queries/users";

describe("upsertUser role granting", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  it("grants the base 'user' role on first login", async () => {
    await upsertUser({
      unionId: "test_first_login",
      name: "New User",
      lastSignInAt: new Date(),
    });

    const user = await findUserByUnionId("test_first_login");
    expect(user?.role).toBe("user");
  });

  it("forces 'user' on first login even if the caller passes a higher role", async () => {
    await upsertUser({
      unionId: "test_privileged_caller",
      name: "Sneaky Caller",
      role: "admin",
      lastSignInAt: new Date(),
    });

    const user = await findUserByUnionId("test_privileged_caller");
    expect(user?.role).toBe("user");
  });

  it("preserves an admin-assigned role across subsequent logins", async () => {
    await upsertUser({
      unionId: "test_elevated_user",
      name: "Future Admin",
      lastSignInAt: new Date(),
    });
    await testDb.db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.unionId, "test_elevated_user"));

    // Subsequent login refreshes the profile but must not demote the admin.
    await upsertUser({
      unionId: "test_elevated_user",
      name: "Future Admin Renamed",
      role: "user",
      lastSignInAt: new Date(),
    });

    const user = await findUserByUnionId("test_elevated_user");
    expect(user?.role).toBe("admin");
    expect(user?.name).toBe("Future Admin Renamed");
  });

  it("never elevates an existing user via caller-supplied role", async () => {
    await upsertUser({
      unionId: "test_regular_user",
      name: "Regular User",
      lastSignInAt: new Date(),
    });

    await upsertUser({
      unionId: "test_regular_user",
      name: "Regular User",
      role: "super_admin",
      lastSignInAt: new Date(),
    });

    const user = await findUserByUnionId("test_regular_user");
    expect(user?.role).toBe("user");
  });
});

describe("upsertUser owner promotion", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    vi.resetModules();
    vi.stubEnv("OWNER_UNION_ID", "google:owner-123");
    const conn = await import("./queries/connection");
    conn.setTestDb(testDb.db);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("grants super_admin to the configured owner on first login", async () => {
    const { upsertUser: ownerUpsert, findUserByUnionId: ownerFind } =
      await import("./queries/users");

    await ownerUpsert({
      unionId: "google:owner-123",
      name: "Owner",
      lastSignInAt: new Date(),
    });

    const user = await ownerFind("google:owner-123");
    expect(user?.role).toBe("super_admin");
  });

  it("keeps the owner at super_admin across logins", async () => {
    const { upsertUser: ownerUpsert, findUserByUnionId: ownerFind } =
      await import("./queries/users");

    await ownerUpsert({
      unionId: "google:owner-123",
      name: "Owner",
      lastSignInAt: new Date(),
    });
    // Simulate a manual demotion; next login must restore super_admin.
    await testDb.db
      .update(users)
      .set({ role: "user" })
      .where(eq(users.unionId, "google:owner-123"));

    await ownerUpsert({
      unionId: "google:owner-123",
      name: "Owner",
      lastSignInAt: new Date(),
    });

    const user = await ownerFind("google:owner-123");
    expect(user?.role).toBe("super_admin");
  });

  it("does not promote non-owner accounts", async () => {
    const { upsertUser: ownerUpsert, findUserByUnionId: ownerFind } =
      await import("./queries/users");

    await ownerUpsert({
      unionId: "google:not-the-owner",
      name: "Not Owner",
      lastSignInAt: new Date(),
    });

    const user = await ownerFind("google:not-the-owner");
    expect(user?.role).toBe("user");
  });
});
