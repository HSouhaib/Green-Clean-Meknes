import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTestDb,
  createTestUser,
  createTestContext,
} from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { activityRouter } from "./activity-router";
import { activityLogs } from "@db/schema";

describe("activity router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Explicit timestamps keep the "newest first" order deterministic
  // (created_at has 1-second resolution).
  async function seedLogs(adminId: number) {
    const base = Date.now() - 60_000;
    await testDb.db.insert(activityLogs).values([
      {
        userId: adminId,
        action: "campaign.created",
        entityType: "campaign",
        entityId: 1,
        details: JSON.stringify({ title: "Cleanup Day" }),
        createdAt: new Date(base),
      },
      {
        userId: adminId,
        action: "volunteer.approved",
        entityType: "volunteer_registration",
        entityId: 2,
        details: JSON.stringify({ name: "Fatima", email: "fatima@test.ma" }),
        createdAt: new Date(base + 1000),
      },
      {
        userId: null,
        action: "user.role_changed",
        entityType: "user",
        entityId: 3,
        createdAt: new Date(base + 2000),
      },
    ]);
  }

  describe("list", () => {
    it("rejects unauthenticated and non-admin callers", async () => {
      const anonCaller = activityRouter.createCaller(createTestContext());
      await expect(anonCaller.list({})).rejects.toThrow(
        "Authentication required"
      );

      const user = createTestUser(testDb.db, { role: "user" });
      const userCaller = activityRouter.createCaller(createTestContext(user));
      await expect(userCaller.list({})).rejects.toThrow(
        "Insufficient permissions"
      );
    });

    it("returns logs newest-first with resolved user names", async () => {
      const admin = createTestUser(testDb.db, {
        role: "admin",
        name: "Admin A",
      });
      await seedLogs(admin.id);

      const caller = activityRouter.createCaller(createTestContext(admin));
      const result = await caller.list({});

      expect(result.total).toBe(3);
      expect(result.logs[0].action).toBe("user.role_changed");
      expect(result.logs[0].userName).toBe("System");
      expect(result.logs[0].userRole).toBeNull();
      expect(result.logs[1].userName).toBe("Admin A");
      expect(result.logs[1].userRole).toBe("admin");
      expect(result.logs[1].details).toEqual({
        name: "Fatima",
        email: "fatima@test.ma",
      });
    });

    it("paginates via cursor", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      await seedLogs(admin.id);

      const caller = activityRouter.createCaller(createTestContext(admin));
      const page1 = await caller.list({ limit: 2 });
      expect(page1.logs).toHaveLength(2);
      expect(page1.page).toBe(1);
      expect(page1.totalPages).toBe(2);

      const page2 = await caller.list({ limit: 2, cursor: 2 });
      expect(page2.logs).toHaveLength(1);
      expect(page2.page).toBe(2);
    });

    it("filters by entityTypes", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      await seedLogs(admin.id);

      const caller = activityRouter.createCaller(createTestContext(admin));
      const result = await caller.list({
        entityTypes: ["campaign", "campaign_photo"],
      });

      expect(result.total).toBe(1);
      expect(result.logs[0].entityType).toBe("campaign");
    });

    it("searches across action, details and user name", async () => {
      const admin = createTestUser(testDb.db, {
        role: "admin",
        name: "Admin A",
      });
      await seedLogs(admin.id);

      const caller = activityRouter.createCaller(createTestContext(admin));

      const byAction = await caller.list({ search: "role_changed" });
      expect(byAction.total).toBe(1);
      expect(byAction.logs[0].action).toBe("user.role_changed");

      const byDetails = await caller.list({ search: "Fatima" });
      expect(byDetails.total).toBe(1);
      expect(byDetails.logs[0].entityType).toBe("volunteer_registration");

      const byUserName = await caller.list({ search: "Admin A" });
      expect(byUserName.total).toBe(2);

      const noMatch = await caller.list({ search: "zzz-no-match" });
      expect(noMatch.total).toBe(0);
    });

    it("searches by actor role and multi-word visible text", async () => {
      const admin = createTestUser(testDb.db, {
        role: "admin",
        name: "Admin A",
      });
      await seedLogs(admin.id);

      const caller = activityRouter.createCaller(createTestContext(admin));

      // "super admin" style: every word must match the stored role value.
      const byRole = await caller.list({ search: "admin" });
      expect(byRole.total).toBe(2);
      expect(byRole.logs.every(l => l.userRole === "admin")).toBe(true);

      // Multi-word: "role changed" matches stored action "user.role_changed".
      const byVisibleAction = await caller.list({ search: "role changed" });
      expect(byVisibleAction.total).toBe(1);
      expect(byVisibleAction.logs[0].action).toBe("user.role_changed");

      // Mixed: actor role + action word.
      const mixed = await caller.list({ search: "admin campaign" });
      expect(mixed.total).toBe(1);
      expect(mixed.logs[0].action).toBe("campaign.created");
    });

    it("filters by date range (dateTo inclusive)", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const base = new Date("2026-07-20T10:00:00Z");
      await testDb.db.insert(activityLogs).values([
        {
          userId: admin.id,
          action: "campaign.created",
          entityType: "campaign",
          createdAt: new Date("2026-07-19T10:00:00Z"),
        },
        {
          userId: admin.id,
          action: "campaign.updated",
          entityType: "campaign",
          createdAt: base,
        },
        {
          userId: admin.id,
          action: "campaign.deleted",
          entityType: "campaign",
          createdAt: new Date("2026-07-21T23:59:00Z"),
        },
      ]);

      const caller = activityRouter.createCaller(createTestContext(admin));

      const fromOnly = await caller.list({ dateFrom: "2026-07-20" });
      expect(fromOnly.total).toBe(2);

      const range = await caller.list({
        dateFrom: "2026-07-20",
        dateTo: "2026-07-20",
      });
      expect(range.total).toBe(1);
      expect(range.logs[0].action).toBe("campaign.updated");

      const toInclusive = await caller.list({ dateTo: "2026-07-20" });
      expect(toInclusive.total).toBe(2);
    });
  });
});
