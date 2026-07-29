import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activityLogs, users } from "@db/schema";
import { eq, desc, and, or, count, inArray, like, gte, lt } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";

export const activityRouter = createRouter({
  // Admin: list activity logs with pagination and filters.
  // `cursor` enables tRPC useInfiniteQuery (cursor = page number).
  // `dateFrom`/`dateTo` are YYYY-MM-DD; dateTo is inclusive.
  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        cursor: z.number().nullish(),
        limit: z.number().default(50),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        entityTypes: z.array(z.string()).optional(),
        search: z
          .string()
          .max(100)
          .optional()
          .transform(s => (s ? sanitizeString(s, 100) : undefined)),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input.cursor ?? input.page;
      const offset = (page - 1) * input.limit;

      const conditions = [];
      if (input.userId) conditions.push(eq(activityLogs.userId, input.userId));
      if (input.action) conditions.push(eq(activityLogs.action, input.action));
      if (input.entityType)
        conditions.push(eq(activityLogs.entityType, input.entityType));
      if (input.entityTypes?.length)
        conditions.push(inArray(activityLogs.entityType, input.entityTypes));
      if (input.search) {
        // Word-based AND search: each word must match the action, the logged
        // details, or the actor's name/role. This lets visible text like
        // "super admin" or "deleted user" match stored values such as
        // role "super_admin" and action "user.deleted".
        const words = input.search.split(/\s+/).filter(Boolean).slice(0, 5);
        for (const word of words) {
          const q = `%${word}%`;
          const matchingUserIds = db
            .select({ id: users.id })
            .from(users)
            .where(or(like(users.name, q), like(users.role, q)));
          conditions.push(
            or(
              like(activityLogs.action, q),
              like(activityLogs.details, q),
              inArray(activityLogs.userId, matchingUserIds)
            )
          );
        }
      }
      if (input.dateFrom) {
        const from = new Date(input.dateFrom);
        if (!isNaN(from.getTime()))
          conditions.push(gte(activityLogs.createdAt, from));
      }
      if (input.dateTo) {
        const to = new Date(input.dateTo);
        if (!isNaN(to.getTime())) {
          // Inclusive end date: everything before the start of the next day.
          to.setDate(to.getDate() + 1);
          conditions.push(lt(activityLogs.createdAt, to));
        }
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, totalResult] = await Promise.all([
        db
          .select()
          .from(activityLogs)
          .where(whereClause)
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit)
          .offset(offset),
        db.select({ count: count() }).from(activityLogs).where(whereClause),
      ]);

      // Get user names
      const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
      const userInfos = new Map<number, { name: string; role: string }>();
      if (userIds.length > 0) {
        const allUsers = await db
          .select({ id: users.id, name: users.name, role: users.role })
          .from(users);
        allUsers.forEach(u =>
          userInfos.set(u.id, { name: u.name ?? "System", role: u.role })
        );
      }

      return {
        logs: logs.map(log => ({
          ...log,
          userName: log.userId
            ? (userInfos.get(log.userId)?.name ?? "Unknown")
            : "System",
          userRole: log.userId
            ? (userInfos.get(log.userId)?.role ?? "user")
            : null,
          details: log.details ? JSON.parse(log.details) : null,
        })),
        total: totalResult[0].count,
        page,
        totalPages: Math.ceil(totalResult[0].count / input.limit),
      };
    }),
});
