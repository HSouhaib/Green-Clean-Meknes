import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { neighborhoods, campaigns } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";

function parseGalleryImages<T extends { galleryImages: string | null | undefined }>(
  campaign: T
): Omit<T, "galleryImages"> & { galleryImages: string[] | null } {
  return {
    ...campaign,
    galleryImages: campaign.galleryImages ? (JSON.parse(campaign.galleryImages) as string[]) : null,
  };
}

// ===== ZOD SCHEMAS =====
const neighborhoodIdSchema = z.object({
  id: z.number().int().positive(),
});

const slugSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

const createNeighborhoodSchema = z.object({
  nameEn: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
  nameFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).transform((s) => sanitizeString(s, 100)),
  descriptionEn: z.string().min(1).max(2000).transform((s) => sanitizeString(s, 2000)),
  descriptionFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  image: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  statsWasteKg: z.number().int().min(0).optional(),
  statsTrees: z.number().int().min(0).optional(),
  statsVolunteers: z.number().int().min(0).optional(),
  statsCampaigns: z.number().int().min(0).optional(),
  mapX: z.number().optional(),
  mapY: z.number().optional(),
});

const updateNeighborhoodSchema = z.object({
  id: z.number().int().positive(),
  nameEn: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  slug: z.string().max(100).optional().transform((s) => s ? sanitizeString(s, 100) : undefined),
  descriptionEn: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  image: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  statsWasteKg: z.number().int().min(0).optional(),
  statsTrees: z.number().int().min(0).optional(),
  statsVolunteers: z.number().int().min(0).optional(),
  statsCampaigns: z.number().int().min(0).optional(),
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  isActive: z.boolean().optional(),
});

// ===== ROUTER =====
export const neighborhoodRouter = createRouter({
  // Public: list all active neighborhoods
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(neighborhoods)
      .where(eq(neighborhoods.isActive, true))
      .orderBy(desc(neighborhoods.createdAt));
  }),

  // Public: get single neighborhood by slug
  getBySlug: publicQuery
    .input(slugSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.slug, sanitizeString(input.slug, 100)))
        .limit(1);
      return result[0] ?? null;
    }),

  // Public: get single neighborhood by ID
  getById: publicQuery
    .input(neighborhoodIdSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  // Public: list all active neighborhoods with their linked active campaigns
  listWithCampaigns: publicQuery.query(async () => {
    const db = getDb();
    const neighborhoodRows = await db
      .select()
      .from(neighborhoods)
      .where(eq(neighborhoods.isActive, true))
      .orderBy(desc(neighborhoods.createdAt));

    const campaignRows = await db
      .select({
        id: campaigns.id,
        titleEn: campaigns.titleEn,
        titleFr: campaigns.titleFr,
        titleAr: campaigns.titleAr,
        slug: campaigns.slug,
        date: campaigns.date,
        status: campaigns.status,
        galleryImages: campaigns.galleryImages,
        neighborhoodId: campaigns.neighborhoodId,
      })
      .from(campaigns)
      .where(eq(campaigns.isActive, true))
      .orderBy(desc(campaigns.eventDate));

    const campaignsByNeighborhood = new Map<number, typeof campaignRows>();
    for (const campaign of campaignRows) {
      if (!campaign.neighborhoodId) continue;
      const list = campaignsByNeighborhood.get(campaign.neighborhoodId) ?? [];
      list.push(campaign);
      campaignsByNeighborhood.set(campaign.neighborhoodId, list);
    }

    return neighborhoodRows.map((neighborhood) => ({
      ...neighborhood,
      campaigns:
        campaignsByNeighborhood
          .get(neighborhood.id)
          ?.map(parseGalleryImages) ?? [],
    }));
  }),

  // Public: get single neighborhood by slug with its linked active campaigns
  getBySlugWithCampaigns: publicQuery
    .input(slugSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(neighborhoods)
        .where(eq(neighborhoods.slug, sanitizeString(input.slug, 100)))
        .limit(1);
      const neighborhood = result[0] ?? null;
      if (!neighborhood) return null;

      const campaignRows = await db
        .select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.isActive, true),
            eq(campaigns.neighborhoodId, neighborhood.id)
          )
        )
        .orderBy(desc(campaigns.eventDate));

      return {
        ...neighborhood,
        campaigns: campaignRows.map(parseGalleryImages),
      };
    }),

  // Admin: list all (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(neighborhoods).orderBy(desc(neighborhoods.createdAt));
  }),

  // Admin: create
  create: adminQuery
    .input(createNeighborhoodSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db.insert(neighborhoods).values(input).run();
      return { id: result.lastInsertRowid, success: true };
    }),

  // Admin: update
  update: adminQuery
    .input(updateNeighborhoodSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(neighborhoods).set(data).where(eq(neighborhoods.id, id));
      return { success: true };
    }),

  // Admin: delete
  delete: adminQuery
    .input(neighborhoodIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(neighborhoods).where(eq(neighborhoods.id, input.id));
      return { success: true };
    }),

  // Admin: toggle active
  toggleActive: adminQuery
    .input(neighborhoodIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(neighborhoods).where(eq(neighborhoods.id, input.id)).limit(1);
      if (!existing[0]) throw new Error("Not found");
      const newState = !existing[0].isActive;
      await db.update(neighborhoods)
        .set({ isActive: newState })
        .where(eq(neighborhoods.id, input.id));
      return { success: true, isActive: newState };
    }),
});
