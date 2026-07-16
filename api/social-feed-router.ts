import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { socialFeedPosts } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { logActivity } from "./lib/activity";
import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";

export const socialFeedRouter = createRouter({
  // Public: list all active social feed posts
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(socialFeedPosts)
      .where(eq(socialFeedPosts.isActive, true))
      .orderBy(socialFeedPosts.sortOrder, desc(socialFeedPosts.createdAt));
  }),

  // Admin: list all posts (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(socialFeedPosts)
      .orderBy(desc(socialFeedPosts.createdAt));
  }),

  // Admin: create post
  create: adminQuery
    .input(
      z.object({
        platform: z.enum(["instagram", "tiktok", "facebook", "twitter"]),
        postUrl: safeUrl(500).transform((s) => sanitizeString(s, 500)),
        embedCode: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
        imageUrl: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionEn: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        authorName: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
        postedAt: z.date().optional(),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = db.insert(socialFeedPosts).values({
        platform: input.platform,
        postUrl: input.postUrl,
        embedCode: input.embedCode ?? null,
        imageUrl: input.imageUrl ?? null,
        captionEn: input.captionEn ?? null,
        captionFr: input.captionFr ?? null,
        captionAr: input.captionAr ?? null,
        authorName: input.authorName ?? null,
        postedAt: input.postedAt ?? null,
        sortOrder: input.sortOrder,
      }).run();

      await logActivity({
        userId: ctx.user?.id,
        action: "socialFeed.created",
        entityType: "socialFeedPost",
        entityId: Number(result.lastInsertRowid),
        details: { platform: input.platform, postUrl: input.postUrl },
      });

      return { success: true, id: Number(result.lastInsertRowid) };
    }),

  // Admin: update post
  update: adminQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        platform: z.enum(["instagram", "tiktok", "facebook", "twitter"]).optional(),
        postUrl: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
        embedCode: z.string().max(2000).optional().nullable().transform((s) => s ? sanitizeString(s, 2000) : undefined),
        imageUrl: safeUrl(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionEn: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionFr: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        captionAr: z.string().max(500).optional().nullable().transform((s) => s ? sanitizeString(s, 500) : undefined),
        authorName: z.string().max(255).optional().nullable().transform((s) => s ? sanitizeString(s, 255) : undefined),
        postedAt: z.date().optional().nullable(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.platform !== undefined) updateData.platform = data.platform;
      if (data.postUrl !== undefined) updateData.postUrl = data.postUrl;
      if (data.embedCode !== undefined) updateData.embedCode = data.embedCode;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.captionEn !== undefined) updateData.captionEn = data.captionEn;
      if (data.captionFr !== undefined) updateData.captionFr = data.captionFr;
      if (data.captionAr !== undefined) updateData.captionAr = data.captionAr;
      if (data.authorName !== undefined) updateData.authorName = data.authorName;
      if (data.postedAt !== undefined) updateData.postedAt = data.postedAt;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

      await db.update(socialFeedPosts).set(updateData).where(eq(socialFeedPosts.id, id));

      await logActivity({
        userId: ctx.user?.id,
        action: "socialFeed.updated",
        entityType: "socialFeedPost",
        entityId: id,
      });

      return { success: true };
    }),

  // Admin: delete post
  delete: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(socialFeedPosts).where(eq(socialFeedPosts.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "socialFeed.deleted",
        entityType: "socialFeedPost",
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
        .from(socialFeedPosts)
        .where(eq(socialFeedPosts.id, input.id))
        .limit(1);
      if (!existing) throw new Error("Social feed post not found");

      await db
        .update(socialFeedPosts)
        .set({ isActive: !existing.isActive })
        .where(eq(socialFeedPosts.id, input.id));

      return { success: true };
    }),
});
