import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext } from "./test-helpers";
import { getDb, setTestDb, clearTestDb } from "./queries/connection";
import { sponsorRouter } from "./sponsor-router";
import type { Sponsor } from "@db/schema";
import { sponsors } from "@db/schema";
import { eq } from "drizzle-orm";

describe("sponsor router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  const insertSponsor = (data: Partial<typeof sponsors.$inferInsert> = {}) => {
    return testDb.db.insert(sponsors).values({
      name: "Test Sponsor",
      logoUrl: "http://example.com/logo.png",
      sponsorType: "business",
      ...data,
    }).run();
  };

  describe("public list", () => {
    it("returns empty array when no sponsors", async () => {
      const caller = sponsorRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toEqual([]);
    });

    it("returns only active sponsors", async () => {
      insertSponsor({ name: "Active", isActive: true });
      insertSponsor({ name: "Inactive", isActive: false });
      const caller = sponsorRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Active");
    });

    it("sorts by sortOrder then createdAt desc", async () => {
      insertSponsor({ name: "A", sortOrder: 2, isActive: true });
      insertSponsor({ name: "B", sortOrder: 1, isActive: true });
      insertSponsor({ name: "C", sortOrder: 1, isActive: true });
      const caller = sponsorRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result[0].name).toBe("B");
      expect(result[1].name).toBe("C");
      expect(result[2].name).toBe("A");
    });
  });

  describe("admin listAll", () => {
    it("returns all sponsors including inactive", async () => {
      insertSponsor({ name: "Active", isActive: true });
      insertSponsor({ name: "Inactive", isActive: false });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.listAll();
      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("creates a sponsor with required fields", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.create({
        name: "New Sponsor",
        logoUrl: "http://example.com/logo.png",
        sponsorType: "ngo",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });

    it("creates with all fields", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.create({
        name: "Full Sponsor",
        nameEn: "English",
        nameFr: "Français",
        nameAr: "العربية",
        logoUrl: "http://example.com/logo.png",
        websiteUrl: "http://example.com",
        sponsorType: "municipality",
        descriptionEn: "Desc EN",
        descriptionFr: "Desc FR",
        descriptionAr: "Desc AR",
        sortOrder: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      await expect(
        caller.create({
          name: "",
          logoUrl: "http://example.com/logo.png",
          sponsorType: "business",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid sponsorType", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      await expect(
        caller.create({
          name: "Bad",
          logoUrl: "http://example.com/logo.png",
          sponsorType: "invalid" as Sponsor["sponsorType"],
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates sponsor name", async () => {
      const { lastInsertRowid } = insertSponsor({ name: "Old" });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.update({
        id: Number(lastInsertRowid),
        name: "New",
      });
      expect(result.success).toBe(true);
      const [updated] = await getDb().select().from(sponsors).where(eq(sponsors.id, Number(lastInsertRowid)));
      expect(updated.name).toBe("New");
    });

    it("updates multiple fields", async () => {
      const { lastInsertRowid } = insertSponsor({ name: "Old" });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      await caller.update({
        id: Number(lastInsertRowid),
        name: "New",
        logoUrl: "http://new.com/logo.png",
        sponsorType: "media",
        sortOrder: 10,
      });
      const [updated] = await getDb().select().from(sponsors).where(eq(sponsors.id, Number(lastInsertRowid)));
      expect(updated.name).toBe("New");
      expect(updated.logoUrl).toBe("http://new.com/logo.png");
      expect(updated.sponsorType).toBe("media");
      expect(updated.sortOrder).toBe(10);
    });
  });

  describe("delete", () => {
    it("deletes a sponsor", async () => {
      const { lastInsertRowid } = insertSponsor();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.delete({ id: Number(lastInsertRowid) });
      expect(result.success).toBe(true);
      const remaining = await getDb().select().from(sponsors).where(eq(sponsors.id, Number(lastInsertRowid)));
      expect(remaining).toHaveLength(0);
    });
  });

  describe("toggleActive", () => {
    it("toggles active status", async () => {
      const { lastInsertRowid } = insertSponsor({ isActive: true });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      const result = await caller.toggleActive({ id: Number(lastInsertRowid) });
      expect(result.success).toBe(true);
      const [updated] = await getDb().select().from(sponsors).where(eq(sponsors.id, Number(lastInsertRowid)));
      expect(updated.isActive).toBe(false);
    });

    it("throws for non-existent sponsor", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sponsorRouter.createCaller(createTestContext(admin));
      await expect(caller.toggleActive({ id: 9999 })).rejects.toThrow("Sponsor not found");
    });
  });
});
