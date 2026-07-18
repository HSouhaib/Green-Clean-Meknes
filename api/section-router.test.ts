import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { sectionRouter } from "./section-router";

describe("section router", () => {
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
    it("returns all section visibility settings", async () => {
      const caller = sectionRouter.createCaller(createTestContext());
      const result = await caller.list();

      expect(result).toHaveLength(15); // from seedTestData (including gallery, socialFeed and sponsors)
      const hero = result.find((s) => s.sectionKey === "hero");
      expect(hero).toBeDefined();
      expect(hero?.isVisible).toBe(true);
    });
  });

  // Admin: toggle
  describe("toggle", () => {
    it("toggles section visibility as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = sectionRouter.createCaller(createTestContext(admin));

      await caller.toggle({ sectionKey: "hero", isVisible: false });

      const hero = testDb.client.prepare("SELECT is_visible FROM section_visibility WHERE section_key = ?").get("hero");
      expect(hero.is_visible).toBe(0);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = sectionRouter.createCaller(createTestContext(user));

      await expect(
        caller.toggle({ sectionKey: "hero", isVisible: false })
      ).rejects.toThrow("Insufficient permissions");
    });
  });
});
