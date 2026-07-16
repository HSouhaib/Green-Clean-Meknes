import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { neighborhoodRouter } from "./neighborhood-router";

function uniqueSlug(base: string) {
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("neighborhood router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  describe("list", () => {
    it("returns only active neighborhoods", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));

      await caller.create({
        nameEn: "Hamria",
        slug: uniqueSlug("hamria"),
        descriptionEn: "A historic neighborhood in Meknes",
      });

      await caller.create({
        nameEn: "Bab Mansour",
        slug: uniqueSlug("bab-mansour"),
        descriptionEn: "Near the famous gate",
      });

      // Toggle one inactive
      const listAll = await caller.listAll();
      const hamria = listAll.find((n) => n.nameEn === "Hamria");
      await caller.toggleActive({ id: hamria!.id });

      const publicCaller = neighborhoodRouter.createCaller(createTestContext());
      const result = await publicCaller.list();
      expect(result).toHaveLength(1);
      expect(result[0].nameEn).toBe("Bab Mansour");
    });
  });

  describe("getBySlug", () => {
    it("returns neighborhood by slug", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));
      const slug = uniqueSlug("hamria");

      await caller.create({
        nameEn: "Hamria",
        slug,
        descriptionEn: "A historic neighborhood",
      });

      const publicCaller = neighborhoodRouter.createCaller(createTestContext());
      const result = await publicCaller.getBySlug({ slug });
      expect(result?.nameEn).toBe("Hamria");
    });

    it("returns null for non-existent slug", async () => {
      const caller = neighborhoodRouter.createCaller(createTestContext());
      const result = await caller.getBySlug({ slug: "does-not-exist-12345" });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a neighborhood as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));

      const result = await caller.create({
        nameEn: "Hamria",
        slug: uniqueSlug("hamria"),
        descriptionEn: "A historic neighborhood in Meknes",
      });

      expect(result.id).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = neighborhoodRouter.createCaller(createTestContext(user));
      await expect(
        caller.create({ nameEn: "Test", slug: uniqueSlug("test"), descriptionEn: "Desc" })
      ).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("update", () => {
    it("updates a neighborhood as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));
      const slug = uniqueSlug("hamria");

      const created = await caller.create({
        nameEn: "Hamria",
        slug,
        descriptionEn: "Original description",
      });

      await caller.update({
        id: created.id as number,
        nameEn: "Hamria Updated",
      });

      const result = await caller.getById({ id: created.id as number });
      expect(result?.nameEn).toBe("Hamria Updated");
    });
  });

  describe("delete", () => {
    it("deletes a neighborhood as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));
      const slug = uniqueSlug("hamria");

      const created = await caller.create({
        nameEn: "Hamria",
        slug,
        descriptionEn: "Desc",
      });

      await caller.delete({ id: created.id as number });
      const result = await caller.getById({ id: created.id as number });
      expect(result).toBeNull();
    });
  });

  describe("toggleActive", () => {
    it("toggles neighborhood active status", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = neighborhoodRouter.createCaller(createTestContext(admin));
      const slug = uniqueSlug("hamria");

      const created = await caller.create({
        nameEn: "Hamria",
        slug,
        descriptionEn: "Desc",
      });

      const result = await caller.toggleActive({ id: created.id as number });
      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
    });
  });
});
