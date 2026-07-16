import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { getDb, setTestDb, clearTestDb } from "./queries/connection";
import { campaignRouter } from "./campaign-router";

describe("campaign router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Public: list campaigns
  describe("list", () => {
    it("returns empty array when no campaigns exist", async () => {
      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toEqual([]);
    });

    it("returns only active campaigns", async () => {
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("Active Campaign", "Meknes", "Description", "15 JUL 2025", "active-campaign", 1);
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("Inactive Campaign", "Meknes", "Description", "15 JUL 2025", "inactive-campaign", 0);

      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].titleEn).toBe("Active Campaign");
    });
  });

  // Public: getBySlug
  describe("getBySlug", () => {
    it("returns campaign by slug", async () => {
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("Test Campaign", "Meknes", "Description", "15 JUL 2025", "test-campaign", 1);

      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.getBySlug({ slug: "test-campaign" });
      expect(result).not.toBeNull();
      expect(result?.titleEn).toBe("Test Campaign");
    });

    it("returns null for non-existent slug", async () => {
      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.getBySlug({ slug: "non-existent" });
      expect(result).toBeNull();
    });
  });

  // Public: stats
  describe("stats", () => {
    it("returns default stats when no data exists", async () => {
      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.stats();
      expect(result.campaigns).toBe(0);
      expect(result.volunteers).toBe(0);
      expect(result.neighborhoods).toBe(0);
      expect(result.wasteKg).toBe(2400); // from seedTestData
      expect(result.trees).toBe(120); // from seedTestData
    });

    it("counts active campaigns and sums per-campaign stats correctly", async () => {
      // Clear settings overrides so we can test auto-calculation from per-campaign stats
      testDb.client.prepare(`DELETE FROM site_settings WHERE key IN (?, ?, ?, ?, ?)`)
        .run('stat_waste_kg', 'stat_trees', 'stat_override_campaigns', 'stat_override_volunteers', 'stat_override_neighborhoods');

      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active, status, stats_waste_kg, stats_trees, stats_volunteers, stats_neighborhoods)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run("Campaign 1", "Meknes", "Desc", "15 JUL 2025", "campaign-1", 1, "completed", 100, 10, 20, 1);
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active, status, stats_waste_kg, stats_trees, stats_volunteers, stats_neighborhoods)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run("Campaign 2", "Fes", "Desc", "15 JUL 2025", "campaign-2", 1, "completed", 200, 20, 30, 1);

      const caller = campaignRouter.createCaller(createTestContext());
      const result = await caller.stats();
      expect(result.campaigns).toBe(2);
      expect(result.neighborhoods).toBe(2); // sum of stats_neighborhoods
      expect(result.wasteKg).toBe(300); // sum of stats_waste_kg
      expect(result.trees).toBe(30); // sum of stats_trees
      expect(result.volunteers).toBe(50); // sum of stats_volunteers
    });
  });

  // Admin: create
  describe("create", () => {
    it("creates a campaign as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = campaignRouter.createCaller(createTestContext(admin));

      const result = await caller.create({
        titleEn: "New Campaign",
        locationEn: "Meknes",
        descriptionEn: "Test description",
        date: "15 JUL 2025",
        slug: "new-campaign",
      });

      expect(result.id).toBeDefined();

      const campaigns = testDb.client.prepare("SELECT * FROM campaigns WHERE slug = ?").all("new-campaign");
      expect(campaigns).toHaveLength(1);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = campaignRouter.createCaller(createTestContext(user));

      await expect(
        caller.create({
          titleEn: "New Campaign",
          locationEn: "Meknes",
          descriptionEn: "Test description",
          date: "15 JUL 2025",
          slug: "new-campaign",
        })
      ).rejects.toThrow("Insufficient permissions");
    });
  });

  // Admin: update
  describe("update", () => {
    it("updates a campaign as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("Old Title", "Meknes", "Desc", "15 JUL 2025", "update-campaign", 1);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = campaignRouter.createCaller(createTestContext(admin));

      const campaign = testDb.client.prepare("SELECT id FROM campaigns WHERE slug = ?").get("update-campaign");

      await caller.update({
        id: campaign.id,
        titleEn: "Updated Title",
      });

      const updated = testDb.client.prepare("SELECT title_en FROM campaigns WHERE id = ?").get(campaign.id);
      expect(updated.title_en).toBe("Updated Title");
    });
  });

  // Admin: delete
  describe("delete", () => {
    it("deletes a campaign as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("To Delete", "Meknes", "Desc", "15 JUL 2025", "delete-campaign", 1);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = campaignRouter.createCaller(createTestContext(admin));

      const campaign = testDb.client.prepare("SELECT id FROM campaigns WHERE slug = ?").get("delete-campaign");

      await caller.delete({ id: campaign.id });

      const remaining = testDb.client.prepare("SELECT * FROM campaigns WHERE id = ?").all(campaign.id);
      expect(remaining).toHaveLength(0);
    });
  });

  // Admin: toggleActive
  describe("toggleActive", () => {
    it("toggles campaign active status", async () => {
      testDb.client.prepare(
        `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run("Toggle Me", "Meknes", "Desc", "15 JUL 2025", "toggle-campaign", 1);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = campaignRouter.createCaller(createTestContext(admin));

      const campaign = testDb.client.prepare("SELECT id FROM campaigns WHERE slug = ?").get("toggle-campaign");

      const result = await caller.toggleActive({ id: campaign.id });
      expect(result.isActive).toBe(false);

      const updated = testDb.client.prepare("SELECT is_active FROM campaigns WHERE id = ?").get(campaign.id);
      expect(updated.is_active).toBe(0);
    });
  });
});
