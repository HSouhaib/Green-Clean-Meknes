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

    // Manual awards (registration/attendance reasons are now derived from
    // campaign_registrations and excluded from manual point totals).
    insertPoint(user1.id, 5, "bonus");
    insertPoint(user2.id, 10, "bonus");
    insertPoint(user3.id, 3, "team_lead");

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

  it("includes guest volunteers in leaderboard rankings", async () => {
    const db = getDb();
    const sqlite = (db as unknown as { $client: { prepare: (sql: string) => { run: (...params: unknown[]) => void } } }).$client;
    const user = createTestUser(db, { name: "Alice", unionId: "alice_guest_test" });

    // Manual award so the registered user still appears alongside the guest.
    insertPoint(user.id, 5, "bonus");

    // Guest with one registered campaign that was attended => 1 registration + 1 attendance = 6 points
    sqlite
      .prepare(
        "INSERT INTO campaign_registrations (campaign_id, user_id, guest_name, guest_email, status, attended, created_at) VALUES (?, ?, ?, ?, ?, ?, unixepoch())"
      )
      .run(1, null, "Guest Hero", "guest@example.com", "registered", 1);

    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.leaderboard.getTop({ limit: 10 });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Guest Hero");
    expect(result[0].isGuest).toBe(true);
    expect(result[0].totalPoints).toBe(6);
    expect(result[0].userId).toBeUndefined();
    expect(result[1].userId).toBe(user.id);
    expect(result[1].totalPoints).toBe(5);
  });

  it("reflects logged-in user registration points in the leaderboard", async () => {
    const db = getDb();
    const sqlite = (db as unknown as { $client: { prepare: (sql: string) => { run: (...params: unknown[]) => { lastInsertRowid: number | bigint } } } }).$client;
    const user = createTestUser(db, { name: "Alice", unionId: "alice_register_test" });

    const campaignResult = sqlite
      .prepare(
        "INSERT INTO campaigns (title_en, location_en, description_en, date, slug, status, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())"
      )
      .run("Clean Garden", "Meknes", "Test", "2026-07-20", "clean-garden", "upcoming", 1);
    const campaignId = Number(campaignResult.lastInsertRowid);

    const userCaller = appRouter.createCaller(createTestContext(user));
    await userCaller.campaign.register({ id: campaignId });

    const publicCaller = appRouter.createCaller(createTestContext());
    const result = await publicCaller.leaderboard.getTop({ limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(user.id);
    expect(result[0].totalPoints).toBe(1);
  });

  it("excludes admins when leaderboard_show_admins is false", async () => {
    const db = getDb();
    const sqlite = (db as unknown as { $client: { prepare: (sql: string) => { run: (...params: unknown[]) => void } } }).$client;
    sqlite
      .prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)")
      .run("leaderboard_show_admins", "false");

    const admin = createTestUser(db, { name: "Admin", role: "admin", unionId: "admin_1" });
    const user = createTestUser(db, { name: "Volunteer", unionId: "volunteer_1" });

    insertPoint(admin.id, 100, "bonus");
    insertPoint(user.id, 5, "bonus");

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

  it("respects period filters", async () => {
    const db = getDb();
    const sqlite = (db as unknown as { $client: { prepare: (sql: string) => { run: (...params: unknown[]) => void } } }).$client;
    const user = createTestUser(db, { name: "Alice", unionId: "alice_period_test" });

    // Old registration (more than a year ago)
    sqlite
      .prepare(
        "INSERT INTO campaign_registrations (campaign_id, user_id, guest_name, guest_email, status, attended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(1, user.id, null, null, "registered", 1, 1);

    // Recent registration
    sqlite
      .prepare(
        "INSERT INTO campaign_registrations (campaign_id, user_id, guest_name, guest_email, status, attended, created_at) VALUES (?, ?, ?, ?, ?, ?, unixepoch())"
      )
      .run(2, user.id, null, null, "registered", 1);

    const caller = appRouter.createCaller(createTestContext());

    const allTime = await caller.leaderboard.getTop({ limit: 10, period: "all" });
    expect(allTime).toHaveLength(1);
    expect(allTime[0].totalPoints).toBe(12); // 2 reg + 2 att

    const thisYear = await caller.leaderboard.getTop({ limit: 10, period: "year" });
    expect(thisYear).toHaveLength(1);
    expect(thisYear[0].totalPoints).toBe(6); // 1 reg + 1 att
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
