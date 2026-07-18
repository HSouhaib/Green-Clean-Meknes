import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { plans, planComments, users } from "@db/schema";
import type { Plan } from "@db/schema";

import { eq, desc, inArray } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";

export const planRouter = createRouter({
  // Admin: list plans with filters
  list: adminQuery
    .input(
      z.object({
        status: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        priority: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        category: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const query = db.select().from(plans).orderBy(desc(plans.createdAt));

      const conditions = [];
      if (input.status) conditions.push(eq(plans.status, input.status as Plan["status"]));
      if (input.priority) conditions.push(eq(plans.priority, input.priority as Plan["priority"]));
      if (input.category) conditions.push(eq(plans.category, input.category));

      const planList = await query;

      // Get creator and assignee names
      const userIds = new Set<number>();
      planList.forEach((p) => {
        userIds.add(p.createdBy);
        if (p.assignedTo) userIds.add(p.assignedTo);
      });

      const userList = userIds.size > 0
        ? await db.select({ id: users.id, name: users.name, avatar: users.avatar }).from(users).where(inArray(users.id, Array.from(userIds)))
        : [];

      const userMap = new Map(userList.map((u) => [u.id, u]));

      return planList.map((plan) => ({
        ...plan,
        createdByName: userMap.get(plan.createdBy)?.name ?? "Unknown",
        assignedToName: plan.assignedTo ? userMap.get(plan.assignedTo)?.name ?? "Unknown" : null,
      }));
    }),

  // Admin: get single plan with comments
  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, input.id))
        .limit(1);

      if (!plan) return null;

      const comments = await db
        .select({
          id: planComments.id,
          content: planComments.content,
          createdAt: planComments.createdAt,
          userId: planComments.userId,
        })
        .from(planComments)
        .where(eq(planComments.planId, input.id))
        .orderBy(desc(planComments.createdAt));

      // Get commenter names
      const commenterIds = [...new Set(comments.map((c) => c.userId))];
      const commenters = commenterIds.length > 0
        ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, commenterIds))
        : [];
      const userMap = new Map(commenters.map((u) => [u.id, u.name]));

      const commentsWithNames = comments.map((c) => ({
        ...c,
        userName: userMap.get(c.userId) ?? "Unknown",
      }));

      const [creator] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, plan.createdBy))
        .limit(1);

      const [assignee] = plan.assignedTo
        ? await db.select({ name: users.name }).from(users).where(eq(users.id, plan.assignedTo)).limit(1)
        : [null];

      return {
        ...plan,
        createdByName: creator?.name ?? "Unknown",
        assignedToName: assignee?.name ?? null,
        comments: commentsWithNames,
      };
    }),

  // Admin: create plan
  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1).transform((s) => sanitizeString(s, 255)),
        description: z.string().optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
        status: z.enum(["backlog", "planned", "in_progress", "completed", "cancelled"]),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        category: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        assignedTo: z.number().optional(),
        targetDate: z.string().optional().transform((s) => s ? sanitizeString(s, 50) : undefined),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(plans).values({
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        category: input.category ?? null,
        createdBy: ctx.user.id,
        assignedTo: input.assignedTo ?? null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      });

      const planId = Number(result.lastInsertRowid);

      await logActivity({
        userId: ctx.user.id,
        action: "plan.created",
        entityType: "plan",
        entityId: planId,
        details: { title: input.title, status: input.status },
      });

      return { success: true, id: planId };
    }),

  // Admin: update plan
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        description: z.string().optional().nullable().transform((s) => s ? sanitizeString(s, 2000) : undefined),
        status: z.enum(["backlog", "planned", "in_progress", "completed", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        category: z.string().optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        assignedTo: z.number().optional().nullable(),
        targetDate: z.string().optional().nullable().transform((s) => s ? sanitizeString(s, 50) : undefined),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, input.id))
        .limit(1);

      if (!existing) throw new Error("Plan not found");

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) {
        updateData.status = input.status;
        if (input.status === "completed") {
          updateData.completedAt = new Date();
        }
      }
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      if (input.targetDate !== undefined) {
        updateData.targetDate = input.targetDate ? new Date(input.targetDate) : null;
      }
      updateData.updatedAt = new Date();

      await db.update(plans).set(updateData).where(eq(plans.id, input.id));

      await logActivity({
        userId: ctx.user.id,
        action: "plan.updated",
        entityType: "plan",
        entityId: input.id,
        details: { changes: Object.keys(updateData) },
      });

      return { success: true };
    }),

  // Admin: delete plan
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(planComments).where(eq(planComments.planId, input.id));
      await db.delete(plans).where(eq(plans.id, input.id));

      await logActivity({
        userId: ctx.user.id,
        action: "plan.deleted",
        entityType: "plan",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Admin: add comment
  addComment: adminQuery
    .input(
      z.object({
        planId: z.number(),
        content: z.string().min(1).transform((s) => sanitizeString(s, 2000)),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(planComments).values({
        planId: input.planId,
        userId: ctx.user.id,
        content: input.content,
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: delete comment
  deleteComment: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(planComments).where(eq(planComments.id, input.id));
      return { success: true };
    }),
});
