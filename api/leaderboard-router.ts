import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  volunteerPoints,
  users,
  campaignRegistrations,
  siteSettings,
} from "@db/schema";
import { eq, and, desc, sum, count, sql } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";
import { logActivity } from "./lib/activity";

const periodSchema = z.enum(["all", "year", "month"]);

interface RawLeaderboardRow {
  user_id: number;
  name: string | null;
  avatar: string | null;
  role: string;
  total_points: number;
  attended_count: number;
}

function getPeriodTimestamp(period: "all" | "year" | "month"): number | null {
  if (period === "all") return null;
  const now = new Date();
  const start = period === "year"
    ? new Date(now.getFullYear(), 0, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  return Math.floor(start.getTime() / 1000);
}

async function getSetting(db: ReturnType<typeof getDb>, key: string, fallback: number): Promise<number> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  if (!row?.value) return fallback;
  const parsed = parseInt(row.value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

async function shouldShowAdmins(db: ReturnType<typeof getDb>): Promise<boolean> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "leaderboard_show_admins"))
    .limit(1);
  return row?.value === "true";
}

function getRawClient(db: ReturnType<typeof getDb>) {
  return (db as unknown as { $client: { prepare: (sql: string) => { all: (...params: unknown[]) => unknown[] } } }).$client;
}

export const leaderboardRouter = createRouter({
  // Public: get top volunteers by total points
  getTop: publicQuery
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(10),
        period: periodSchema.default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const showAdmins = await shouldShowAdmins(db);
      const periodStart = getPeriodTimestamp(input.period);

      const rawClient = getRawClient(db);

      const timeFilter = periodStart
        ? `AND vp.created_at >= ?`
        : "";
      const params: (number | string)[] = [];
      if (periodStart) params.push(periodStart);
      params.push(input.limit);

      const roleFilter = showAdmins
        ? ""
        : "AND u.role NOT IN ('admin', 'super_admin')";

      const query = `
        SELECT
          u.id AS user_id,
          u.name,
          u.avatar,
          u.role,
          COALESCE(SUM(vp.points), 0) AS total_points,
          COALESCE(att.attended_count, 0) AS attended_count
        FROM users u
        INNER JOIN volunteer_points vp ON vp.user_id = u.id
        LEFT JOIN (
          SELECT user_id, COUNT(*) AS attended_count
          FROM campaign_registrations
          WHERE attended = 1 AND user_id IS NOT NULL
          GROUP BY user_id
        ) att ON att.user_id = u.id
        WHERE 1=1
          ${timeFilter}
          ${roleFilter}
        GROUP BY u.id
        ORDER BY total_points DESC
        LIMIT ?
      `;

      const rows = rawClient.prepare(query).all(...params) as RawLeaderboardRow[];

      let rank = 0;
      let previousPoints: number | null = null;
      let displayRank = 0;

      return rows.map((row) => {
        rank++;
        if (previousPoints === null || row.total_points < previousPoints) {
          displayRank = rank;
        }
        previousPoints = row.total_points;

        return {
          rank: displayRank,
          userId: row.user_id,
          name: row.name ?? "Anonymous",
          avatar: row.avatar ?? null,
          role: row.role,
          totalPoints: row.total_points,
          attendedCount: row.attended_count,
        };
      });
    }),

  // Public: get a single user's rank and point breakdown
  getUserRank: publicQuery
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();

      const [userRow] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRow) return null;

      const [totalResult] = await db
        .select({ total: sum(volunteerPoints.points) })
        .from(volunteerPoints)
        .where(eq(volunteerPoints.userId, input.userId));

      const totalPoints = Number(totalResult?.total ?? 0);

      // Compute rank: count distinct users with more points
      const higherScorers = await db
        .select({ userId: volunteerPoints.userId })
        .from(volunteerPoints)
        .groupBy(volunteerPoints.userId)
        .having(sql`SUM(${volunteerPoints.points}) > ${totalPoints}`);

      const rank = higherScorers.length + 1;

      const breakdown = await db
        .select({
          reason: volunteerPoints.reason,
          total: sum(volunteerPoints.points),
          count: count(),
        })
        .from(volunteerPoints)
        .where(eq(volunteerPoints.userId, input.userId))
        .groupBy(volunteerPoints.reason);

      const [attendedResult] = await db
        .select({ attended: count() })
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.userId, input.userId),
            eq(campaignRegistrations.attended, true)
          )
        );

      return {
        userId: input.userId,
        name: userRow.name ?? "Anonymous",
        avatar: userRow.avatar ?? null,
        role: userRow.role,
        totalPoints,
        rank,
        attendedCount: attendedResult?.attended ?? 0,
        breakdown: breakdown.map((b) => ({
          reason: b.reason,
          total: Number(b.total ?? 0),
          count: b.count,
        })),
      };
    }),

  // Admin: award manual points to a user
  awardPoints: adminQuery
    .input(
      z.object({
        userId: z.number().int().positive(),
        points: z.number().int(),
        reason: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
        campaignId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      const result = db
        .insert(volunteerPoints)
        .values({
          userId: input.userId,
          campaignId: input.campaignId ?? null,
          points: input.points,
          reason: input.reason,
          awardedBy: ctx.user.id,
        })
        .run();

      await logActivity({
        userId: ctx.user.id,
        action: "leaderboard.award_points",
        entityType: "volunteer_points",
        entityId: Number(result.lastInsertRowid),
        details: {
          targetUser: user.unionId,
          points: input.points,
          reason: input.reason,
        },
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: list recent point awards with optional user filter
  listAwards: adminQuery
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [];
      if (input.userId) {
        conditions.push(eq(volunteerPoints.userId, input.userId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(volunteerPoints)
        .where(whereClause)
        .orderBy(desc(volunteerPoints.createdAt))
        .limit(input.limit);

      const userIds = rows.map((r) => r.userId);
      const awardedByIds = rows
        .map((r) => r.awardedBy)
        .filter((id): id is number => id !== null);

      const allUserIds = Array.from(new Set([...userIds, ...awardedByIds]));

      const userRows =
        allUserIds.length > 0
          ? await db
              .select()
              .from(users)
              .where(sql`${users.id} IN ${allUserIds}`)
          : [];

      const userMap = new Map(userRows.map((u) => [u.id, u]));

      return rows.map((row) => ({
        ...row,
        user: userMap.get(row.userId) ?? null,
        awardedByUser: row.awardedBy
          ? (userMap.get(row.awardedBy) ?? null)
          : null,
      }));
    }),

  // Internal helper exposed for other routers: get current point values
  getPointSettings: publicQuery.query(async () => {
    const db = getDb();
    const [registration, attendance] = await Promise.all([
      getSetting(db, "points_registration", 1),
      getSetting(db, "points_attendance", 5),
    ]);
    return {
      registration,
      attendance,
    };
  }),
});
