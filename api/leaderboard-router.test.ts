import { describe, it, expect, beforeEach } from "vitest";
import {
  createTestDb,
  createTestUser,
  createTestContext,
  seedTestData,
} from "./test-helpers";
import { appRouter } from "./router";
import { getDb, setTestDb, clearTestDb } from "./queries/connection";

describe("leaderboard router", () => {
  beforeEach(() => {
    const { db, client } = createTestDb();
    setTestDb(db);
    seedTestData(db);
    return () => {
      clearTestDb();
      client.close();
    };
  });

  function insertPoint(
    userId: number,
    points: number,
    reason: string,
    campaignId?: number
  ) {
    const sqlite = (getDb() as unknown as { $client: { prepare: (sql: string) => { run: (...params: unknown[]) => void } } }).$client;
    sqlite
      .prepare(
        "INSERT INTO volunteer_points (user_id, campaign_id, points, reason, created_at) VALUES (?, ?, ?, ?, unixepoch())"
      )
      .run(userId, campaignId ?? null, points, reason);
  }

  it("returns empty leaderboard when no points exist", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.leaderboard.getTop({ limit: 10 });
    expect(result).toEqual([]);
  });

  it("ranks users by total points", async () => {
    const db = getDb();
    const user1 = createTestUser(db, { name: "Alice", unionId: "alice_1" });
    const user2 = createTestUser(db, { name: "Bob", unionId: "bob_1" });
    const user3 = createTestUser(db, { name: "Carol", unionId: "carol_1" });

    insertPoint(user1.id, 5, "attendance");
    insertPoint(user2.id, 10, "attendance");
    insertPoint(user3.id, 3, "registration");

    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.leaderboard.getTop({ limit: 10 });

    expect(result).toHaveLength(3);
    expect(result[0].userId).toBe(user2.id);
    expect(result[0].rank).toBe(1);
    expect(result[0].totalPoints).toBe(10);
    expect(result[1].userId).toBe(user1.id);
    expect(result[1].rank).toBe(2);
    expect(result[2].userId).toBe(user3.id);
    expect(result[2].rank).toBe(3);
  });

  it("excludes admins when leaderboard_show_admins is false", async () => {
    const db = getDb();
    const admin = createTestUser(db, { name: "Admin", role: "admin", unionId: "admin_1" });
    const user = createTestUser(db, { name: "Volunteer", unionId: "volunteer_1" });

    insertPoint(admin.id, 100, "attendance");
    insertPoint(user.id, 5, "attendance");

    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.leaderboard.getTop({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(user.id);
  });

  it("returns user rank and breakdown", async () => {
    const db = getDb();
    const user = createTestUser(db, { name: "Alice", unionId: "alice_2" });
    const other = createTestUser(db, { name: "Bob", unionId: "bob_2" });

    insertPoint(user.id, 5, "attendance");
    insertPoint(user.id, 1, "registration");
    insertPoint(other.id, 10, "attendance");

    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.leaderboard.getUserRank({ userId: user.id });

    expect(result).not.toBeNull();
    expect(result!.totalPoints).toBe(6);
    expect(result!.rank).toBe(2);
    expect(result!.breakdown).toHaveLength(2);
  });

  it("allows admins to award points", async () => {
    const db = getDb();
    const admin = createTestUser(db, { role: "admin", unionId: "admin_2" });
    const user = createTestUser(db, { name: "Volunteer", unionId: "volunteer_2" });

    const caller = appRouter.createCaller(createTestContext(admin));
    const result = await caller.leaderboard.awardPoints({
      userId: user.id,
      points: 15,
      reason: "Team lead bonus",
    });

    expect(result.success).toBe(true);

    const publicCaller = appRouter.createCaller(createTestContext());
    const top = await publicCaller.leaderboard.getTop({ limit: 10 });
    expect(top).toHaveLength(1);
    expect(top[0].totalPoints).toBe(15);
  });

  it("rejects non-admin point awards", async () => {
    const db = getDb();
    const user = createTestUser(db, { unionId: "user_1" });
    const target = createTestUser(db, { unionId: "target_1" });

    const caller = appRouter.createCaller(createTestContext(user));
    await expect(
      caller.leaderboard.awardPoints({
        userId: target.id,
        points: 10,
        reason: "Test",
      })
    ).rejects.toThrow("Insufficient permissions");
  });

  it("lists recent awards for admins", async () => {
    const db = getDb();
    const admin = createTestUser(db, { role: "admin", unionId: "admin_3" });
    const user = createTestUser(db, { unionId: "user_2" });

    const caller = appRouter.createCaller(createTestContext(admin));
    await caller.leaderboard.awardPoints({
      userId: user.id,
      points: 7,
      reason: "Helper",
    });

    const awards = await caller.leaderboard.listAwards({ limit: 10 });
    expect(awards).toHaveLength(1);
    expect(awards[0].points).toBe(7);
    expect(awards[0].user?.id).toBe(user.id);
  });
});
