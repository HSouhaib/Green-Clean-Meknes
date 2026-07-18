import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestDb,
  createTestUser,
  createTestContext,
  seedTestData,
} from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { badgeRouter } from "./badge-router";

function insertCampaign(
  client: ReturnType<typeof createTestDb>["client"],
  title: string,
  slug: string
) {
  return client
    .prepare(
      `INSERT INTO campaigns (title_en, location_en, description_en, date, slug, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, "Meknes", "Description", "15 JUL 2025", slug, 1)
    .lastInsertRowid as number;
}

function insertRegistration(
  client: ReturnType<typeof createTestDb>["client"],
  campaignId: number,
  userId: number
) {
  return client
    .prepare(
      `INSERT INTO campaign_registrations (campaign_id, user_id, status, attended)
       VALUES (?, ?, ?, ?)`
    )
    .run(campaignId, userId, "registered", 0).lastInsertRowid as number;
}

describe("badge router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  describe("myBadge", () => {
    it("returns a token and QR code for a registered user", async () => {
      const user = createTestUser(testDb.db);
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up");
      insertRegistration(testDb.client, campaignId, user.id);

      const caller = badgeRouter.createCaller(createTestContext(user));
      const result = await caller.myBadge({ campaignId });

      expect(result.token).toBeTruthy();
      expect(result.qrDataUrl).toContain("data:image/png;base64,");
      expect(result.user.id).toBe(user.id);
      expect(result.campaign.id).toBe(campaignId);
      expect(result.attended).toBe(false);
    });

    it("throws when the user is not registered for the campaign", async () => {
      const user = createTestUser(testDb.db);
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up");

      const caller = badgeRouter.createCaller(createTestContext(user));
      await expect(caller.myBadge({ campaignId })).rejects.toThrow(
        /registered for this campaign/
      );
    });
  });

  describe("verify", () => {
    it("marks attendance and returns badge info for a valid token", async () => {
      const user = createTestUser(testDb.db);
      const admin = createTestUser(testDb.db, {
        unionId: "admin",
        role: "admin",
      });
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up");
      insertRegistration(testDb.client, campaignId, user.id);

      const userCaller = badgeRouter.createCaller(createTestContext(user));
      const badge = await userCaller.myBadge({ campaignId });

      const adminCaller = badgeRouter.createCaller(createTestContext(admin));
      const result = await adminCaller.verify({ token: badge.token });

      expect(result.valid).toBe(true);
      expect(result.previouslyAttended).toBe(false);
      expect(result.user?.id).toBe(user.id);
      expect(result.campaign?.id).toBe(campaignId);
      expect(result.role).toBe("user");

      const points = testDb.client.prepare(
        "SELECT SUM(points) as total FROM volunteer_points WHERE user_id = ? AND reason = ?"
      ).get(user.id, "attendance") as { total: number } | undefined;
      expect(points?.total).toBe(5);
    });

    it("does not award duplicate attendance points", async () => {
      const user = createTestUser(testDb.db, { unionId: "dup_user" });
      const admin = createTestUser(testDb.db, {
        unionId: "admin_dup",
        role: "admin",
      });
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up-dup");
      insertRegistration(testDb.client, campaignId, user.id);

      const userCaller = badgeRouter.createCaller(createTestContext(user));
      const badge = await userCaller.myBadge({ campaignId });

      const adminCaller = badgeRouter.createCaller(createTestContext(admin));
      await adminCaller.verify({ token: badge.token });
      await adminCaller.verify({ token: badge.token });

      const rows = testDb.client.prepare(
        "SELECT COUNT(*) as count FROM volunteer_points WHERE user_id = ? AND reason = ? AND campaign_id = ?"
      ).get(user.id, "attendance", campaignId) as { count: number };
      expect(rows.count).toBe(1);
    });

    it("rejects an invalid token", async () => {
      const admin = createTestUser(testDb.db, {
        unionId: "admin",
        role: "admin",
      });
      const caller = badgeRouter.createCaller(createTestContext(admin));
      await expect(caller.verify({ token: "bad-token" })).rejects.toThrow(
        /Invalid or expired badge/
      );
    });

    it("rejects non-admin callers", async () => {
      const user = createTestUser(testDb.db);
      const caller = badgeRouter.createCaller(createTestContext(user));
      await expect(caller.verify({ token: "any" })).rejects.toThrow(
        /Insufficient permissions/
      );
    });
  });

  describe("markAttendance", () => {
    it("toggles attendance for a registration", async () => {
      const admin = createTestUser(testDb.db, {
        unionId: "admin",
        role: "admin",
      });
      const user = createTestUser(testDb.db);
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up");
      const regId = insertRegistration(testDb.client, campaignId, user.id);

      const caller = badgeRouter.createCaller(createTestContext(admin));
      await caller.markAttendance({ registrationId: regId, attended: true });

      const rows = testDb.client
        .prepare("SELECT attended FROM campaign_registrations WHERE id = ?")
        .get(regId) as { attended: number };
      expect(rows.attended).toBe(1);
    });
  });

  describe("listAttendance", () => {
    it("returns registered users for a campaign", async () => {
      const admin = createTestUser(testDb.db, {
        unionId: "admin",
        role: "admin",
      });
      const user = createTestUser(testDb.db);
      const campaignId = insertCampaign(testDb.client, "Clean Up", "clean-up");
      insertRegistration(testDb.client, campaignId, user.id);

      const caller = badgeRouter.createCaller(createTestContext(admin));
      const result = await caller.listAttendance({ campaignId });

      expect(result).toHaveLength(1);
      expect(result[0].user?.id).toBe(user.id);
    });
  });
});
