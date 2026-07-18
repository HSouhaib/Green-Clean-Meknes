import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext } from "./test-helpers";
import { getDb, setTestDb, clearTestDb } from "./queries/connection";
import { socialFeedRouter } from "./social-feed-router";
import type { SocialFeedPost } from "@db/schema";
import { socialFeedPosts } from "@db/schema";
import { eq } from "drizzle-orm";

describe("social feed router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  const insertPost = (data: Partial<typeof socialFeedPosts.$inferInsert> = {}) => {
    return testDb.db.insert(socialFeedPosts).values({
      platform: "instagram",
      postUrl: "https://instagram.com/test",
      imageUrl: "/assets/test.jpg",
      ...data,
    }).run();
  };

  describe("public list", () => {
    it("returns empty array when no posts", async () => {
      const caller = socialFeedRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toEqual([]);
    });

    it("returns only active posts", async () => {
      insertPost({ platform: "instagram", isActive: true });
      insertPost({ platform: "tiktok", isActive: false });
      const caller = socialFeedRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe("instagram");
    });

    it("sorts by sortOrder then createdAt desc", async () => {
      insertPost({ platform: "instagram", sortOrder: 2, isActive: true });
      insertPost({ platform: "tiktok", sortOrder: 1, isActive: true });
      insertPost({ platform: "facebook", sortOrder: 1, isActive: true });
      const caller = socialFeedRouter.createCaller(createTestContext());
      const result = await caller.list();
      expect(result[0].platform).toBe("tiktok");
      expect(result[1].platform).toBe("facebook");
      expect(result[2].platform).toBe("instagram");
    });
  });

  describe("admin listAll", () => {
    it("returns all posts including inactive", async () => {
      insertPost({ isActive: true });
      insertPost({ isActive: false });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.listAll();
      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("creates a post with required fields", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.create({
        platform: "tiktok",
        postUrl: "https://tiktok.com/@greenmeknes",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBeGreaterThan(0);
    });

    it("creates with all fields", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.create({
        platform: "facebook",
        postUrl: "https://facebook.com/greenmeknes",
        embedCode: "<iframe>...</iframe>",
        imageUrl: "/assets/test.jpg",
        captionEn: "Test EN",
        captionFr: "Test FR",
        captionAr: "Test AR",
        authorName: "@greenmeknes",
        sortOrder: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid platform", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      await expect(
        caller.create({
          platform: "youtube" as SocialFeedPost["platform"],
          postUrl: "https://youtube.com/test",
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("updates post platform", async () => {
      const { lastInsertRowid } = insertPost({ platform: "instagram" });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.update({
        id: Number(lastInsertRowid),
        platform: "twitter",
      });
      expect(result.success).toBe(true);
      const [updated] = await getDb().select().from(socialFeedPosts).where(eq(socialFeedPosts.id, Number(lastInsertRowid)));
      expect(updated.platform).toBe("twitter");
    });
  });

  describe("delete", () => {
    it("deletes a post", async () => {
      const { lastInsertRowid } = insertPost();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.delete({ id: Number(lastInsertRowid) });
      expect(result.success).toBe(true);
      const remaining = await getDb().select().from(socialFeedPosts).where(eq(socialFeedPosts.id, Number(lastInsertRowid)));
      expect(remaining).toHaveLength(0);
    });
  });

  describe("toggleActive", () => {
    it("toggles active status", async () => {
      const { lastInsertRowid } = insertPost({ isActive: true });
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      const result = await caller.toggleActive({ id: Number(lastInsertRowid) });
      expect(result.success).toBe(true);
      const [updated] = await getDb().select().from(socialFeedPosts).where(eq(socialFeedPosts.id, Number(lastInsertRowid)));
      expect(updated.isActive).toBe(false);
    });

    it("throws for non-existent post", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = socialFeedRouter.createCaller(createTestContext(admin));
      await expect(caller.toggleActive({ id: 9999 })).rejects.toThrow("Social feed post not found");
    });
  });
});
