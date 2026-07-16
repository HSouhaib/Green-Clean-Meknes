import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sponsors } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";

export const sponsorRouter = createRouter({
  // Public: list all active sponsors
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(sponsors)
      .where(eq(sponsors.isActive, true))
      .orderBy(sponsors.sortOrder, desc(sponsors.createdAt));
  }),

  // Admin: list all sponsors (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(sponsors)
      .orderBy(desc(sponsors.createdAt));
  }),

  // Admin: create sponsor
  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
        nameEn: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        nameFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        nameAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        logoUrl: safeUrl(500).transform((s) => sanitizeString(s, 500)),
        websiteUrl: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        sponsorType: z.enum(["municipality", "ngo", "business", "media", "other"]),
        descriptionEn: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        descriptionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        descriptionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = db.insert(sponsors).values({
        name: input.name,
        nameEn: input.nameEn ?? null,
        nameFr: input.nameFr ?? null,
        nameAr: input.nameAr ?? null,
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl ?? null,
        sponsorType: input.sponsorType,
        descriptionEn: input.descriptionEn ?? null,
        descriptionFr: input.descriptionFr ?? null,
        descriptionAr: input.descriptionAr ?? null,
        sortOrder: input.sortOrder,
      }).run();

      await logActivity({
        userId: ctx.user?.id,
        action: "sponsor.created",
        entityType: "sponsor",
        entityId: Number(result.lastInsertRowid),
        details: { name: input.name, type: input.sponsorType },
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: update sponsor
  update: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        nameEn: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        nameFr: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        nameAr: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        logoUrl: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        websiteUrl: safeUrl(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        sponsorType: z.enum(["municipality", "ngo", "business", "media", "other"]).optional(),
        descriptionEn: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        descriptionFr: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        descriptionAr: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
      if (data.nameFr !== undefined) updateData.nameFr = data.nameFr;
      if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
      if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
      if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
      if (data.sponsorType !== undefined) updateData.sponsorType = data.sponsorType;
      if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
      if (data.descriptionFr !== undefined) updateData.descriptionFr = data.descriptionFr;
      if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

      await db.update(sponsors).set(updateData).where(eq(sponsors.id, id));

      await logActivity({
        userId: ctx.user?.id,
        action: "sponsor.updated",
        entityType: "sponsor",
        entityId: id,
      });

      return { success: true };
    }),

  // Admin: delete sponsor
  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(sponsors).where(eq(sponsors.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "sponsor.deleted",
        entityType: "sponsor",
        entityId: input.id,
      });

      return { success: true };
    }),

  // Admin: toggle active
  toggleActive: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(sponsors)
        .where(eq(sponsors.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Sponsor not found");

      await db
        .update(sponsors)
        .set({ isActive: !existing.isActive })
        .where(eq(sponsors.id, input.id));

      return { success: true };
    }),
});
