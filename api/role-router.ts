import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { userRoles, users } from "@db/schema";
import { eq, count } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";

const ALL_PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "users.manage",
  "users.edit_role",
  "roles.view",
  "roles.manage",
  "campaigns.view",
  "campaigns.manage",
  "contacts.view",
  "contacts.manage",
  "sections.view",
  "sections.manage",
  "settings.view",
  "settings.manage",
  "neighborhoods.view",
  "neighborhoods.manage",
  "faqs.view",
  "faqs.manage",
  "testimonials.view",
  "testimonials.manage",
  "polls.view",
  "polls.manage",
  "plans.view",
  "plans.manage",
  "activity_logs.view",
];

export const roleRouter = createRouter({
  // Admin: list all roles with user count
  list: adminQuery.query(async () => {
    const db = getDb();
    const roles = await db.select().from(userRoles).orderBy(userRoles.isSystem);

    const userCounts = await db
      .select({ role: users.role, count: count() })
      .from(users)
      .groupBy(users.role);

    const countMap = new Map(userCounts.map((u) => [u.role, u.count]));

    return roles.map((role) => ({
      ...role,
      userCount: countMap.get(role.name) ?? 0,
    }));
  }),

  // Admin: create custom role
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).regex(/^[a-z_]+$/, "Name must be lowercase with underscores only").transform((s) => sanitizeString(s, 255)),
        labelEn: z.string().min(1).transform((s) => sanitizeString(s, 255)),
        labelFr: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        labelAr: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        permissions: z.array(z.string().transform((s) => sanitizeString(s, 255))),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(userRoles).values({
        name: input.name,
        labelEn: input.labelEn,
        labelFr: input.labelFr ?? null,
        labelAr: input.labelAr ?? null,
        permissions: JSON.stringify(input.permissions),
        isSystem: false,
      });

      await logActivity({
        userId: ctx.user?.id,
        action: "role.created",
        entityType: "role",
        entityId: Number(result.lastInsertRowid),
        details: { name: input.name, permissions: input.permissions },
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: update role
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        labelEn: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        labelFr: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        labelAr: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        permissions: z.array(z.string().transform((s) => sanitizeString(s, 255))).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.id, input.id))
        .limit(1);

      if (!existing) throw new Error("Role not found");

      const updateData: Record<string, unknown> = {};
      if (input.labelEn !== undefined) updateData.labelEn = input.labelEn;
      if (input.labelFr !== undefined) updateData.labelFr = input.labelFr;
      if (input.labelAr !== undefined) updateData.labelAr = input.labelAr;
      if (input.permissions !== undefined) updateData.permissions = JSON.stringify(input.permissions);

      await db.update(userRoles).set(updateData).where(eq(userRoles.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "role.updated",
        entityType: "role",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Admin: delete role
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.id, input.id))
        .limit(1);

      if (!existing) throw new Error("Role not found");
      if (existing.isSystem) throw new Error("Cannot delete system roles");

      // Check if users are assigned to this role
      const [userCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, existing.name));

      if (userCount.count > 0) {
        throw new Error(`Cannot delete role: ${userCount.count} users are assigned to it`);
      }

      await db.delete(userRoles).where(eq(userRoles.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "role.deleted",
        entityType: "role",
        entityId: input.id,
        details: { name: existing.name },
      });

      return { success: true };
    }),

  // Admin: get available permissions list
  permissions: adminQuery.query(async () => {
    return ALL_PERMISSIONS;
  }),
});
