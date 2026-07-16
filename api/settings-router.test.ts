import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { settingsRouter } from "./settings-router";

describe("settings router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Public: list
  describe("list", () => {
    it("returns all settings as a key-value map", async () => {
      const caller = settingsRouter.createCaller(createTestContext());
      const result = await caller.list();

      expect(result["stat_waste_kg"]).toBe("2400");
      expect(result["stat_trees"]).toBe("120");
      expect(result["contact_email"]).toBe("contact@greenmeknes.ma");
    });
  });

  // Public: get
  describe("get", () => {
    it("returns a single setting value", async () => {
      const caller = settingsRouter.createCaller(createTestContext());
      const result = await caller.get({ key: "stat_waste_kg" });

      expect(result).toBe("2400");
    });

    it("returns null for non-existent key", async () => {
      const caller = settingsRouter.createCaller(createTestContext());
      const result = await caller.get({ key: "non_existent_key" });

      expect(result).toBeNull();
    });
  });

  // Admin: update
  describe("update", () => {
    it("updates a single setting as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = settingsRouter.createCaller(createTestContext(admin));

      await caller.update({ key: "stat_waste_kg", value: "5000" });

      const updated = testDb.client.prepare("SELECT value FROM site_settings WHERE key = ?").get("stat_waste_kg");
      expect(updated.value).toBe("5000");
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = settingsRouter.createCaller(createTestContext(user));

      await expect(
        caller.update({ key: "stat_waste_kg", value: "5000" })
      ).rejects.toThrow("Insufficient permissions");
    });
  });

  // Admin: updateMany
  describe("updateMany", () => {
    it("updates multiple settings at once as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = settingsRouter.createCaller(createTestContext(admin));

      await caller.updateMany({
        "stat_waste_kg": "5000",
        "stat_trees": "200",
        "new_key": "new_value",
      });

      const waste = testDb.client.prepare("SELECT value FROM site_settings WHERE key = ?").get("stat_waste_kg");
      expect(waste.value).toBe("5000");

      const trees = testDb.client.prepare("SELECT value FROM site_settings WHERE key = ?").get("stat_trees");
      expect(trees.value).toBe("200");

      const newKey = testDb.client.prepare("SELECT value FROM site_settings WHERE key = ?").get("new_key");
      expect(newKey.value).toBe("new_value");
    });
  });
});
