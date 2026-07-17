import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, campaignRegistrations, campaigns } from "@db/schema";
import { eq, like, or, desc, count, and } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";

export const userRouter = createRouter({
  // Admin: list all users with pagination, search, filter by role
  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z
          .string()
          .optional()
          .transform(s => (s ? sanitizeString(s, 255) : undefined)),
        role: z
          .string()
          .optional()
          .transform(s => (s ? sanitizeString(s, 255) : undefined)),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(like(users.name, searchTerm), like(users.email, searchTerm))
        );
      }
      if (input.role) {
        conditions.push(eq(users.role, input.role));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [userList, totalResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(input.limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(whereClause),
      ]);

      return {
        users: userList,
        total: totalResult[0].count,
        page: input.page,
        totalPages: Math.ceil(totalResult[0].count / input.limit),
      };
    }),

  // Admin: get single user with registration history
  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!user) return null;

      const registrations = await db
        .select({
          id: campaignRegistrations.id,
          status: campaignRegistrations.status,
          notes: campaignRegistrations.notes,
          createdAt: campaignRegistrations.createdAt,
          campaignId: campaigns.id,
          campaignTitle: campaigns.titleEn,
          campaignDate: campaigns.date,
        })
        .from(campaignRegistrations)
        .innerJoin(
          campaigns,
          eq(campaignRegistrations.campaignId, campaigns.id)
        )
        .where(eq(campaignRegistrations.userId, input.id))
        .orderBy(desc(campaignRegistrations.createdAt));

      return { ...user, registrations };
    }),

  // Admin: update user role
  updateRole: adminQuery
    .input(z.object({ id: z.number(), role: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error("User not found");
      }

      const oldRole = existing.role;

      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "user.role_changed",
        entityType: "user",
        entityId: input.id,
        details: { oldRole, newRole: input.role },
      });

      return { success: true };
    }),

  // Admin: toggle user active status
  toggleStatus: adminQuery
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(users.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: input.isActive ? "user.activated" : "user.deactivated",
        entityType: "user",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Admin: reset (disable) two-factor authentication for a user
  resetTwoFactor: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error("User not found");
      }

      await db
        .update(users)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "user.two_factor_reset",
        entityType: "user",
        entityId: input.id,
        details: { targetUser: existing.unionId },
      });

      return { success: true };
    }),

  // Admin: hard-delete user (permanently removed from database)
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error("User not found");
      }

      await db.delete(users).where(eq(users.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "user.deleted",
        entityType: "user",
        entityId: input.id,
        details: { name: existing.name, email: existing.email },
      });

      return { success: true };
    }),

  // Admin: user activity summary
  activitySummary: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [regCount] = await db
        .select({ count: count() })
        .from(campaignRegistrations)
        .where(eq(campaignRegistrations.userId, input.id));

      const [attendedCount] = await db
        .select({ count: count() })
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.userId, input.id),
            eq(campaignRegistrations.status, "attended")
          )
        );

      return {
        registrations: regCount.count,
        attended: attendedCount.count,
      };
    }),
});
