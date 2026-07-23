import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaigns, campaignRegistrations, users } from "@db/schema";
import { eq, desc, and, count, inArray, gte, isNotNull, sum } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";
import { checkRateLimit } from "./lib/rate-limit";
import {
  awardRegistrationPoints,
  removeRegistrationPoints,
} from "./lib/leaderboard-points";
import { CAMPAIGN_STATUSES } from "@contracts/constants";

// ===== ZOD SCHEMAS =====
const campaignIdSchema = z.object({
  id: z.number().int().positive(),
});

const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);

const createCampaignSchema = z.object({
  titleEn: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
  titleFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  titleAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  locationEn: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
  locationFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  locationAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  descriptionEn: z.string().min(1).max(2000).transform((s) => sanitizeString(s, 2000)),
  descriptionFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  date: z.string().min(1).max(50).transform((s) => sanitizeString(s, 50)),
  eventDate: z.number().optional().transform((n) => n ? new Date(n * 1000) : undefined),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).transform((s) => sanitizeString(s, 100)),
  galleryImages: z.array(safeUrl(500)).max(10).optional().transform((arr) =>
    arr ? JSON.stringify(arr.map((s) => sanitizeString(s, 500))) : undefined
  ),
  filterTags: z.string().max(255).default("all").transform((s) => sanitizeString(s, 255)),
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  status: campaignStatusSchema.default("upcoming"),
  statsWasteKg: z.number().int().min(0).default(0),
  statsTrees: z.number().int().min(0).default(0),
  statsVolunteers: z.number().int().min(0).default(0),
  statsNeighborhoods: z.number().int().min(0).default(0),
});

const updateCampaignSchema = z.object({
  id: z.number().int().positive(),
  titleEn: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  titleFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  titleAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  locationEn: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  locationFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  locationAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  descriptionEn: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  descriptionAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  date: z.string().max(50).optional().transform((s) => s ? sanitizeString(s, 50) : undefined),
  eventDate: z.number().optional().transform((n) => n ? new Date(n * 1000) : undefined),
  galleryImages: z.array(safeUrl(500)).max(10).optional().transform((arr) =>
    arr ? JSON.stringify(arr.map((s) => sanitizeString(s, 500))) : undefined
  ),
  filterTags: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  isActive: z.boolean().optional(),
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  status: campaignStatusSchema.optional(),
  statsWasteKg: z.number().int().min(0).optional(),
  statsTrees: z.number().int().min(0).optional(),
  statsVolunteers: z.number().int().min(0).optional(),
  statsNeighborhoods: z.number().int().min(0).optional(),
});

function parseGalleryImages<T extends { galleryImages: string | null | undefined }>(
  campaign: T
): Omit<T, "galleryImages"> & { galleryImages: string[] | null } {
  return {
    ...campaign,
    galleryImages: campaign.galleryImages ? (JSON.parse(campaign.galleryImages) as string[]) : null,
  };
}

// ===== ROUTER =====
export const campaignRouter = createRouter({
  // Public: get dashboard stats (hybrid: admin overrides + auto-calculated from campaigns)
  stats: publicQuery.query(async () => {
    const db = getDb();
    const { siteSettings } = await import("@db/schema");

    // Get all settings
    const settingsResult = await db.select().from(siteSettings);
    const settingsMap = new Map(settingsResult.map((s) => [s.key, s.value]));

    // Helper: get admin override or auto-calculated value
    const getOverrideOrAuto = (overrideKey: string, autoValue: number) => {
      const override = settingsMap.get(overrideKey);
      if (override && override.trim() !== '') {
        const parsed = parseInt(override, 10);
        if (!isNaN(parsed)) return parsed;
      }
      return autoValue;
    };

    // Auto-calculated: total active campaigns
    const campaignResult = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.isActive, true));
    const autoCampaigns = campaignResult[0]?.count ?? 0;

    // Auto-calculated: sum per-campaign impact stats
    const statsResult = await db
      .select({
        wasteKg: sum(campaigns.statsWasteKg),
        trees: sum(campaigns.statsTrees),
        volunteers: sum(campaigns.statsVolunteers),
        neighborhoods: sum(campaigns.statsNeighborhoods),
      })
      .from(campaigns)
      .where(eq(campaigns.isActive, true));

    const autoWasteKg = Number(statsResult[0]?.wasteKg ?? 0);
    const autoTrees = Number(statsResult[0]?.trees ?? 0);
    const autoVolunteers = Number(statsResult[0]?.volunteers ?? 0);
    const autoNeighborhoods = Number(statsResult[0]?.neighborhoods ?? 0);

    // Admin overrides take precedence over auto-calculated
    const campaignsCount = getOverrideOrAuto('stat_override_campaigns', autoCampaigns);
    const volunteersCount = getOverrideOrAuto('stat_override_volunteers', autoVolunteers);
    const neighborhoodsCount = getOverrideOrAuto('stat_override_neighborhoods', autoNeighborhoods);
    const wasteKg = getOverrideOrAuto('stat_waste_kg', autoWasteKg);
    const trees = getOverrideOrAuto('stat_trees', autoTrees);

    return {
      campaigns: campaignsCount,
      volunteers: volunteersCount,
      neighborhoods: neighborhoodsCount,
      wasteKg,
      trees,
      // Metadata for admin: show which values are overridden
      _meta: {
        campaignsOverridden: !!settingsMap.get('stat_override_campaigns')?.trim(),
        volunteersOverridden: !!settingsMap.get('stat_override_volunteers')?.trim(),
        neighborhoodsOverridden: !!settingsMap.get('stat_override_neighborhoods')?.trim(),
        wasteKgOverridden: !!settingsMap.get('stat_waste_kg')?.trim(),
        treesOverridden: !!settingsMap.get('stat_trees')?.trim(),
      }
    };
  }),
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.isActive, true))
      .orderBy(desc(campaigns.createdAt));
    return rows.map(parseGalleryImages);
  }),

  // Public: get upcoming campaigns (with eventDate in the future)
  upcoming: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();

    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          gte(campaigns.eventDate, now)
        )
      )
      .orderBy(campaigns.eventDate);
    return rows.map(parseGalleryImages);
  }),

  // Public: get next campaign countdown target
  nextCampaign: publicQuery.query(async () => {
    const db = getDb();
    const now = new Date();

    const result = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          gte(campaigns.eventDate, now)
        )
      )
      .orderBy(campaigns.eventDate)
      .limit(1);

    return result[0] ? parseGalleryImages(result[0]) : null;
  }),

  // Public: get all campaigns with eventDate for calendar view
  calendar: publicQuery.query(async () => {
    const db = getDb();

    const rows = await db
      .select({
        id: campaigns.id,
        titleEn: campaigns.titleEn,
        titleFr: campaigns.titleFr,
        titleAr: campaigns.titleAr,
        date: campaigns.date,
        eventDate: campaigns.eventDate,
        slug: campaigns.slug,
        locationEn: campaigns.locationEn,
        locationFr: campaigns.locationFr,
        locationAr: campaigns.locationAr,
        galleryImages: campaigns.galleryImages,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          isNotNull(campaigns.eventDate)
        )
      )
      .orderBy(campaigns.eventDate);
    return rows.map(parseGalleryImages);
  }),

  // Public: get single campaign by slug
  getBySlug: publicQuery
    .input(z.object({ slug: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.slug, sanitizeString(input.slug, 100)))
        .limit(1);
      return result[0] ? parseGalleryImages(result[0]) : null;
    }),

  // Public: get registration count for a campaign
  registrationCount: publicQuery
    .input(campaignIdSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({ count: count() })
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.id),
            eq(campaignRegistrations.status, "registered")
          )
        );
      return result[0]?.count ?? 0;
    }),

  // Public: register as guest (no login required)
  registerGuest: publicQuery
    .input(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(100).transform((s) => sanitizeString(s, 100)),
        email: z.string().email().max(255).transform((s) => sanitizeString(s, 255).toLowerCase()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.headers.get("x-forwarded-for") || ctx.req.headers.get("x-real-ip") || "unknown";
      if (!checkRateLimit(ip, 10)) {
        return { success: false, message: "Rate limit exceeded. Please try again later." };
      }
      const db = getDb();

      // Check if already registered as guest with same email
      const existing = await db
        .select()
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.id),
            eq(campaignRegistrations.guestEmail, input.email)
          )
        )
        .limit(1);

      if (existing[0]) {
        if (existing[0].status === "registered") {
          return { success: false, message: "Already registered with this email" };
        }
        // Re-activate cancelled guest registration
        await db
          .update(campaignRegistrations)
          .set({ status: "registered", guestName: input.name })
          .where(eq(campaignRegistrations.id, existing[0].id));
        return { success: true, message: "Re-registered" };
      }

      await db.insert(campaignRegistrations).values({
        campaignId: input.id,
        guestName: input.name,
        guestEmail: input.email,
        status: "registered",
      });

      return { success: true, message: "Registered" };
    }),

  // Authed: register for a campaign
  register: authedQuery
    .input(campaignIdSchema)
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.headers.get("x-forwarded-for") || ctx.req.headers.get("x-real-ip") || "unknown";
      if (!checkRateLimit(ip, 10)) {
        return { success: false, message: "Rate limit exceeded. Please try again later." };
      }
      const db = getDb();
      const userId = ctx.user.id;

      // Check if already registered
      const existing = await db
        .select()
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.id),
            eq(campaignRegistrations.userId, userId)
          )
        )
        .limit(1);

      if (existing[0]) {
        if (existing[0].status === "registered") {
          return { success: false, message: "Already registered" };
        }
        // Re-activate cancelled registration
        await db
          .update(campaignRegistrations)
          .set({ status: "registered" })
          .where(eq(campaignRegistrations.id, existing[0].id));
        await awardRegistrationPoints(userId, input.id);
        return { success: true, message: "Re-registered" };
      }

      await db.insert(campaignRegistrations).values({
        campaignId: input.id,
        userId,
        status: "registered",
      });
      await awardRegistrationPoints(userId, input.id);

      return { success: true, message: "Registered" };
    }),

  // Authed: unregister from a campaign
  unregister: authedQuery
    .input(campaignIdSchema)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      await db
        .update(campaignRegistrations)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.id),
            eq(campaignRegistrations.userId, userId)
          )
        );

      await removeRegistrationPoints(userId, input.id);

      return { success: true };
    }),

  // Authed: check my registration status for a campaign
  myRegistrationStatus: authedQuery
    .input(campaignIdSchema)
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const result = await db
        .select()
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.id),
            eq(campaignRegistrations.userId, userId)
          )
        )
        .limit(1);

      return result[0]?.status ?? null;
    }),

  // Authed: list my registered campaigns
  myRegistrations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const regs = await db
      .select()
      .from(campaignRegistrations)
      .where(
        and(
          eq(campaignRegistrations.userId, userId),
          eq(campaignRegistrations.status, "registered")
        )
      )
      .orderBy(desc(campaignRegistrations.createdAt));

    const campaignIds = regs.map((r) => r.campaignId);

    // Fetch ALL campaigns associated with registrations (including inactive)
    // to ensure user's registered campaigns are never removed from their view
    const campaignData = campaignIds.length > 0
      ? await db.select().from(campaigns).where(inArray(campaigns.id, campaignIds))
      : [];

    // Map by id for lookup
    const campaignMap = new Map(
      campaignData.map((c) => [c.id, parseGalleryImages(c)])
    );

    return regs.map((reg) => ({
      ...reg,
      campaign: campaignMap.get(reg.campaignId) ?? null,
    }));
  }),

  // Admin: list all registrations for a campaign (with user details + guest info)
  registrationsByCampaign: adminQuery
    .input(campaignIdSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const regs = await db
        .select()
        .from(campaignRegistrations)
        .where(eq(campaignRegistrations.campaignId, input.id))
        .orderBy(desc(campaignRegistrations.createdAt));

      const userIds = regs.map((r) => r.userId).filter((id): id is number => id !== null);
      const userData = userIds.length > 0
        ? await db.select().from(users).where(inArray(users.id, userIds))
        : [];

      const userMap = new Map(userData.map((u) => [u.id, u]));

      return regs.map((reg) => ({
        ...reg,
        user: reg.userId ? (userMap.get(reg.userId) ?? null) : null,
      }));
    }),

  // Admin: delete a campaign registration
  deleteRegistration: adminQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(campaignRegistrations).where(eq(campaignRegistrations.id, input.id));
      return { success: true };
    }),

  // Admin: record how many kilograms of waste a volunteer collected
  updateRegistrationWaste: adminQuery
    .input(
      z.object({
        registrationId: z.number().int().positive(),
        wasteKg: z.number().int().min(0).max(1_000_000),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [registration] = await db
        .select()
        .from(campaignRegistrations)
        .where(eq(campaignRegistrations.id, input.registrationId))
        .limit(1);

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration not found",
        });
      }

      await db
        .update(campaignRegistrations)
        .set({ wasteKg: input.wasteKg })
        .where(eq(campaignRegistrations.id, input.registrationId));

      return { success: true };
    }),

  // Admin: list all campaigns (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt));
    return rows.map(parseGalleryImages);
  }),

  // Admin: create campaign
  create: adminQuery
    .input(createCampaignSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db.insert(campaigns).values(input).run();
      return { id: result.lastInsertRowid };
    }),

  // Admin: update campaign
  update: adminQuery
    .input(updateCampaignSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(campaigns).set(data).where(eq(campaigns.id, id));
      return { success: true };
    }),

  // Admin: delete campaign
  delete: adminQuery
    .input(campaignIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(campaigns).where(eq(campaigns.id, input.id));
      return { success: true };
    }),

  // Admin: toggle campaign active status
  toggleActive: adminQuery
    .input(campaignIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, input.id))
        .limit(1);
      if (!result[0]) throw new Error("Campaign not found");
      await db
        .update(campaigns)
        .set({ isActive: !result[0].isActive })
        .where(eq(campaigns.id, input.id));
      return { success: true, isActive: !result[0].isActive };
    }),

  // Admin: count new campaign registrations (last 24 hours)
  registrationTotalCount: adminQuery.query(async () => {
    const db = getDb();
    const yesterday = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    const { sql } = await import("drizzle-orm");
    const [result] = await db
      .select({ count: count() })
      .from(campaignRegistrations)
      .where(
        and(
          eq(campaignRegistrations.status, "registered"),
          sql`${campaignRegistrations.createdAt} >= ${yesterday}`
        )
      );
    return result.count;
  }),
});
