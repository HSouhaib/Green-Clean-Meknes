import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { activityLogs, users } from "@db/schema";
import { eq, desc, and, count } from "drizzle-orm";

export const activityRouter = createRouter({
  // Admin: list activity logs with pagination and filters
  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.userId) conditions.push(eq(activityLogs.userId, input.userId));
      if (input.action) conditions.push(eq(activityLogs.action, input.action));
      if (input.entityType) conditions.push(eq(activityLogs.entityType, input.entityType));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, totalResult] = await Promise.all([
        db
          .select()
          .from(activityLogs)
          .where(whereClause)
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(activityLogs)
          .where(whereClause),
      ]);

      // Get user names
      const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
      const userNames = new Map<number, string>();
      if (userIds.length > 0) {
        const allUsers = await db.select({ id: users.id, name: users.name }).from(users);
        allUsers.forEach((u) => userNames.set(u.id, u.name ?? "System"));
      }

      return {
        logs: logs.map((log) => ({
          ...log,
          userName: log.userId ? userNames.get(log.userId) ?? "Unknown" : "System",
          details: log.details ? JSON.parse(log.details) : null,
        })),
        total: totalResult[0].count,
        page: input.page,
        totalPages: Math.ceil(totalResult[0].count / input.limit),
      };
    }),
});
