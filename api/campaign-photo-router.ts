import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaignPhotos, campaigns } from "@db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";

export const campaignPhotoRouter = createRouter({
  // Public: list all active photos (optionally filtered by campaign)
  list: publicQuery
    .input(
      z.object({
        campaignId: z.number().optional(),
        photoType: z.enum(["before", "after"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(campaignPhotos.isActive, true)];
      if (input?.campaignId) {
        conditions.push(eq(campaignPhotos.campaignId, input.campaignId));
      }
      if (input?.photoType) {
        conditions.push(eq(campaignPhotos.photoType, input.photoType));
      }
      const photos = await db
        .select({
          id: campaignPhotos.id,
          campaignId: campaignPhotos.campaignId,
          imageUrl: campaignPhotos.imageUrl,
          photoType: campaignPhotos.photoType,
          captionEn: campaignPhotos.captionEn,
          captionFr: campaignPhotos.captionFr,
          captionAr: campaignPhotos.captionAr,
          sortOrder: campaignPhotos.sortOrder,
          createdAt: campaignPhotos.createdAt,
        })
        .from(campaignPhotos)
        .where(and(...conditions))
        .orderBy(campaignPhotos.sortOrder, desc(campaignPhotos.createdAt));

      // Get campaign titles for display
      const campaignIds = [...new Set(photos.map((p) => p.campaignId))];
      // Fetch all campaigns for mapping
      const allCampaigns = campaignIds.length > 0
        ? await db.select({ id: campaigns.id, titleEn: campaigns.titleEn }).from(campaigns).where(inArray(campaigns.id, campaignIds))
        : [];
      const campaignMap = new Map(allCampaigns.map((c) => [c.id, c.titleEn]));

      return photos.map((p) => ({
        ...p,
        campaignTitle: campaignMap.get(p.campaignId) || "Unknown Campaign",
      }));
    }),

  // Public: list photos grouped by campaign (for gallery display)
  listByCampaign: publicQuery.query(async () => {
    const db = getDb();
    const photos = await db
      .select()
      .from(campaignPhotos)
      .where(eq(campaignPhotos.isActive, true))
      .orderBy(campaignPhotos.sortOrder, desc(campaignPhotos.createdAt));

    const campaignIds = [...new Set(photos.map((p) => p.campaignId))];
    const allCampaigns = campaignIds.length > 0
      ? await db.select({ id: campaigns.id, titleEn: campaigns.titleEn, titleFr: campaigns.titleFr, titleAr: campaigns.titleAr, slug: campaigns.slug }).from(campaigns).where(inArray(campaigns.id, campaignIds))
      : [];
    const campaignMap = new Map(allCampaigns.map((c) => [c.id, c]));

    const grouped = new Map<number, { campaign: typeof allCampaigns[0]; before: typeof photos; after: typeof photos }>();
    for (const photo of photos) {
      const campaign = campaignMap.get(photo.campaignId);
      if (!campaign) continue;
      if (!grouped.has(photo.campaignId)) {
        grouped.set(photo.campaignId, { campaign, before: [], after: [] });
      }
      const group = grouped.get(photo.campaignId)!;
      if (photo.photoType === "before") group.before.push(photo);
      else group.after.push(photo);
    }

    return Array.from(grouped.values());
  }),

  // Admin: list all photos (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const photos = await db
      .select()
      .from(campaignPhotos)
      .orderBy(desc(campaignPhotos.createdAt));

    const campaignIds = [...new Set(photos.map((p) => p.campaignId))];
    const allCampaigns = campaignIds.length > 0
      ? await db.select({ id: campaigns.id, titleEn: campaigns.titleEn }).from(campaigns).where(inArray(campaigns.id, campaignIds))
      : [];
    const campaignMap = new Map(allCampaigns.map((c) => [c.id, c.titleEn]));

    return photos.map((p) => ({
      ...p,
      campaignTitle: campaignMap.get(p.campaignId) || "Unknown Campaign",
    }));
  }),

  // Admin: create photo
  create: adminQuery
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        imageUrl: safeUrl(500).transform((s) => sanitizeString(s, 500)),
        photoType: z.enum(["before", "after"]),
        captionEn: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        captionFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        captionAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = db.insert(campaignPhotos).values({
        campaignId: input.campaignId,
        imageUrl: input.imageUrl,
        photoType: input.photoType,
        captionEn: input.captionEn ?? null,
        captionFr: input.captionFr ?? null,
        captionAr: input.captionAr ?? null,
        sortOrder: input.sortOrder,
      }).run();

      await logActivity({
        userId: ctx.user?.id,
        action: "photo.created",
        entityType: "campaign_photo",
        entityId: Number(result.lastInsertRowid),
        details: { campaignId: input.campaignId, photoType: input.photoType },
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: update photo
  update: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        imageUrl: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        photoType: z.enum(["before", "after"]).optional(),
        captionEn: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        captionFr: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        captionAr: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.photoType !== undefined) updateData.photoType = data.photoType;
      if (data.captionEn !== undefined) updateData.captionEn = data.captionEn;
      if (data.captionFr !== undefined) updateData.captionFr = data.captionFr;
      if (data.captionAr !== undefined) updateData.captionAr = data.captionAr;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

      await db.update(campaignPhotos).set(updateData).where(eq(campaignPhotos.id, id));

      await logActivity({
        userId: ctx.user?.id,
        action: "photo.updated",
        entityType: "campaign_photo",
        entityId: id,
      });

      return { success: true };
    }),

  // Admin: delete photo
  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(campaignPhotos).where(eq(campaignPhotos.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "photo.deleted",
        entityType: "campaign_photo",
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
        .from(campaignPhotos)
        .where(eq(campaignPhotos.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Photo not found");

      await db
        .update(campaignPhotos)
        .set({ isActive: !existing.isActive })
        .where(eq(campaignPhotos.id, input.id));

      return { success: true };
    }),
});
