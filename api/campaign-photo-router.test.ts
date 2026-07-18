import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { campaignPhotoRouter } from "./campaign-photo-router";

describe("campaign photo router", () => {
  let testDb: ReturnType<typeof createTestDb>;
  let campaignId: number;

  beforeEach(() => {
    testDb = createTestDb();
    setTestDb(testDb.db);
    // Insert a test campaign
    const result = testDb.client.prepare(
      `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, filter_tags, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, unixepoch(), unixepoch())`
    ).run("Test Campaign", "Meknes", "Test description", "01 JAN 2025", "test-campaign", "all");
    campaignId = result.lastInsertRowid as number;
  });

  afterEach(() => {
    clearTestDb();
  });

  it("returns empty array when no photos exist", async () => {
    const caller = campaignPhotoRouter.createCaller(createTestContext());
    const result = await caller.list();
    expect(result).toEqual([]);
  });

  it("creates a photo as admin", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    const result = await caller.create({
      campaignId,
      imageUrl: "/assets/test-before.jpg",
      photoType: "before",
      captionEn: "Before cleanup",
    });
    expect(result.id).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("lists photos with campaign info", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    await caller.create({ campaignId, imageUrl: "/assets/test-before.jpg", photoType: "before" });
    await caller.create({ campaignId, imageUrl: "/assets/test-after.jpg", photoType: "after" });

    const publicCaller = campaignPhotoRouter.createCaller(createTestContext());
    const result = await publicCaller.list();
    expect(result).toHaveLength(2);
    expect(result[0].campaignTitle).toBe("Test Campaign");
  });

  it("groups photos by campaign", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    await caller.create({ campaignId, imageUrl: "/assets/b1.jpg", photoType: "before" });
    await caller.create({ campaignId, imageUrl: "/assets/a1.jpg", photoType: "after" });

    const publicCaller = campaignPhotoRouter.createCaller(createTestContext());
    const result = await publicCaller.listByCampaign();
    expect(result).toHaveLength(1);
    expect(result[0].before).toHaveLength(1);
    expect(result[0].after).toHaveLength(1);
  });

  it("rejects non-admin users for create", async () => {
    const user = createTestUser(testDb.db, { role: "user" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(user));
    await expect(caller.create({
      campaignId,
      imageUrl: "/assets/test.jpg",
      photoType: "before",
    })).rejects.toThrow("Insufficient permissions");
  });

  it("updates a photo as admin", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    const created = await caller.create({
      campaignId,
      imageUrl: "/assets/test.jpg",
      photoType: "before",
    });

    await caller.update({
      id: created.id,
      captionEn: "Updated caption",
    });

    const publicCaller = campaignPhotoRouter.createCaller(createTestContext());
    const photos = await publicCaller.list();
    expect(photos[0].captionEn).toBe("Updated caption");
  });

  it("deletes a photo as admin", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    const created = await caller.create({
      campaignId,
      imageUrl: "/assets/test.jpg",
      photoType: "before",
    });

    await caller.delete({ id: created.id });

    const publicCaller = campaignPhotoRouter.createCaller(createTestContext());
    const photos = await publicCaller.list();
    expect(photos).toHaveLength(0);
  });

  it("toggles photo active status", async () => {
    const admin = createTestUser(testDb.db, { role: "admin" });
    const caller = campaignPhotoRouter.createCaller(createTestContext(admin));
    const created = await caller.create({
      campaignId,
      imageUrl: "/assets/test.jpg",
      photoType: "before",
    });

    await caller.toggleActive({ id: created.id });

    const publicCaller = campaignPhotoRouter.createCaller(createTestContext());
    const photos = await publicCaller.list();
    expect(photos).toHaveLength(0); // Inactive, so not listed

    const allPhotos = await caller.listAll();
    expect(allPhotos).toHaveLength(1);
    expect(allPhotos[0].isActive).toBe(false);
  });
});
