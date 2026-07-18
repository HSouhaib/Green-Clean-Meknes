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
  identity: string;
  user_id: number | null;
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

      const registrationPoints = await getSetting(db, "points_registration", 1);
      const attendancePoints = await getSetting(db, "points_attendance", 5);
      const perWasteKgPoints = await getSetting(db, "points_per_waste_kg", 0);

      const userTimeFilter = periodStart ? "AND cr.created_at >= ?" : "";
      const guestTimeFilter = periodStart ? "AND cr.created_at >= ?" : "";
      const manualTimeFilter = periodStart ? "AND vp.created_at >= ?" : "";
      const roleFilter = showAdmins
        ? ""
        : "AND u.role NOT IN ('admin', 'super_admin')";

      // User scores: derive registration/attendance/waste points from
      // campaign_registrations so every registered user appears even if the
      // volunteer_points table is missing registration rows. Waste points use the
      // campaign's stats_waste_kg for attended registrations. Add manual points from
      // volunteer_points (excluding registration/attendance reasons to avoid double counting).
      const userQuery = `
        SELECT
          'user:' || u.id AS identity,
          u.id AS user_id,
          u.name,
          u.avatar,
          u.role,
          COALESCE(reg_counts.reg_count, 0) * ? + COALESCE(reg_counts.att_count, 0) * ? + COALESCE(reg_counts.waste_kg, 0) * ? + COALESCE(manual_points.total, 0) AS total_points,
          COALESCE(reg_counts.att_count, 0) AS attended_count
        FROM (
          SELECT DISTINCT user_id FROM (
            SELECT cr.user_id FROM campaign_registrations cr WHERE cr.user_id IS NOT NULL AND cr.status = 'registered' ${userTimeFilter}
            UNION
            SELECT vp.user_id FROM volunteer_points vp WHERE vp.reason NOT IN ('registration', 'attendance') ${manualTimeFilter}
          )
        ) combined
        INNER JOIN users u ON u.id = combined.user_id
        LEFT JOIN (
          SELECT cr.user_id,
            COUNT(*) AS reg_count,
            SUM(CASE WHEN cr.attended = 1 THEN 1 ELSE 0 END) AS att_count,
            SUM(CASE WHEN cr.attended = 1 THEN COALESCE(c.stats_waste_kg, 0) ELSE 0 END) AS waste_kg
          FROM campaign_registrations cr
          LEFT JOIN campaigns c ON c.id = cr.campaign_id
          WHERE cr.user_id IS NOT NULL AND cr.status = 'registered' ${userTimeFilter}
          GROUP BY cr.user_id
        ) reg_counts ON reg_counts.user_id = u.id
        LEFT JOIN (
          SELECT vp.user_id, SUM(vp.points) AS total
          FROM volunteer_points vp
          WHERE vp.reason NOT IN ('registration', 'attendance') ${manualTimeFilter}
          GROUP BY vp.user_id
        ) manual_points ON manual_points.user_id = u.id
        WHERE 1=1 ${roleFilter}
        ORDER BY total_points DESC
        LIMIT ?
      `;

      // Guest scores: derive registration/attendance/waste points from guest
      // campaign registrations. Waste points use the campaign's stats_waste_kg.
      const guestQuery = `
        SELECT
          'guest:' || COALESCE(cr.guest_email, cr.guest_name) AS identity,
          NULL AS user_id,
          cr.guest_name AS name,
          NULL AS avatar,
          'guest' AS role,
          (COUNT(*) * ?) + (SUM(CASE WHEN cr.attended = 1 THEN 1 ELSE 0 END) * ?) + (SUM(CASE WHEN cr.attended = 1 THEN COALESCE(c.stats_waste_kg, 0) ELSE 0 END) * ?) AS total_points,
          SUM(CASE WHEN cr.attended = 1 THEN 1 ELSE 0 END) AS attended_count
        FROM campaign_registrations cr
        LEFT JOIN campaigns c ON c.id = cr.campaign_id
        WHERE cr.user_id IS NULL
          AND cr.guest_name IS NOT NULL
          AND cr.status = 'registered'
          ${guestTimeFilter}
        GROUP BY cr.guest_email, cr.guest_name
        ORDER BY total_points DESC
        LIMIT ?
      `;

      const userParams: (number | string)[] = [
        registrationPoints,
        attendancePoints,
        perWasteKgPoints,
      ];
      if (periodStart) {
        // combined subquery: userTimeFilter + manualTimeFilter
        userParams.push(periodStart, periodStart);
        // reg_counts + manual_points subqueries
        userParams.push(periodStart, periodStart);
      }
      userParams.push(input.limit);

      const guestParams: (number | string)[] = [
        registrationPoints,
        attendancePoints,
        perWasteKgPoints,
      ];
      if (periodStart) guestParams.push(periodStart);
      guestParams.push(input.limit);

      const [userRows, guestRows] = await Promise.all([
        rawClient.prepare(userQuery).all(...userParams) as RawLeaderboardRow[],
        rawClient.prepare(guestQuery).all(...guestParams) as RawLeaderboardRow[],
      ]);

      const rows = [...userRows, ...guestRows]
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, input.limit);

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
          identity: row.identity,
          userId: row.user_id ?? undefined,
          name: row.name ?? "Anonymous",
          avatar: row.avatar ?? null,
          role: row.role,
          isGuest: row.user_id === null,
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
    const [registration, attendance, perWasteKg] = await Promise.all([
      getSetting(db, "points_registration", 1),
      getSetting(db, "points_attendance", 5),
      getSetting(db, "points_per_waste_kg", 0),
    ]);
    return {
      registration,
      attendance,
      perWasteKg,
    };
  }),
});
