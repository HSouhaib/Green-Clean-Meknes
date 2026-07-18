import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaigns, campaignRegistrations, users } from "@db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  generateBadgeToken,
  verifyBadgeToken,
  generateBadgeQr,
  type BadgePayload,
} from "./lib/badge";
import {
  awardAttendancePoints,
  hasAttendancePoints,
} from "./lib/leaderboard-points";

const campaignIdSchema = z.object({
  campaignId: z.number().int().positive(),
});

const verifySchema = z.object({
  token: z.string().min(1),
});

const markAttendanceSchema = z.object({
  registrationId: z.number().int().positive(),
  attended: z.boolean(),
});

export const badgeRouter = createRouter({
  // Generate a digital badge for the current user for a specific campaign
  myBadge: authedQuery.input(campaignIdSchema).query(async ({ ctx, input }) => {
    const db = getDb();
    const userId = ctx.user.id;

    const [registration] = await db
      .select()
      .from(campaignRegistrations)
      .where(
        and(
          eq(campaignRegistrations.campaignId, input.campaignId),
          eq(campaignRegistrations.userId, userId),
          eq(campaignRegistrations.status, "registered")
        )
      )
      .limit(1);

    if (!registration) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not registered for this campaign",
      });
    }

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, input.campaignId))
      .limit(1);

    if (!campaign) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campaign not found",
      });
    }

    const payload: BadgePayload = {
      userId,
      campaignId: input.campaignId,
      role: ctx.user.role,
    };

    const token = await generateBadgeToken(payload);
    const qrDataUrl = await generateBadgeQr(token);

    return {
      token,
      qrDataUrl,
      attended: registration.attended ?? false,
      campaign: {
        id: campaign.id,
        titleEn: campaign.titleEn,
        titleFr: campaign.titleFr,
        titleAr: campaign.titleAr,
        date: campaign.date,
        eventDate: campaign.eventDate,
        locationEn: campaign.locationEn,
      },
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
      },
    };
  }),

  // Verify a badge token and mark the registration as attended
  verify: adminQuery.input(verifySchema).mutation(async ({ input }) => {
    const db = getDb();
    const payload = await verifyBadgeToken(input.token);

    if (!payload) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired badge",
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, payload.campaignId))
      .limit(1);

    const [registration] = await db
      .select()
      .from(campaignRegistrations)
      .where(
        and(
          eq(campaignRegistrations.campaignId, payload.campaignId),
          eq(campaignRegistrations.userId, payload.userId),
          eq(campaignRegistrations.status, "registered")
        )
      )
      .limit(1);

    const previouslyAttended = registration?.attended ?? false;

    if (registration && !previouslyAttended) {
      await db
        .update(campaignRegistrations)
        .set({ attended: true })
        .where(eq(campaignRegistrations.id, registration.id));

      const alreadyHasPoints = await hasAttendancePoints(
        payload.userId,
        payload.campaignId
      );
      if (!alreadyHasPoints) {
        await awardAttendancePoints(payload.userId, payload.campaignId);
      }
    }

    return {
      valid: true,
      previouslyAttended,
      attended: true,
      role: payload.role,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        : null,
      campaign: campaign
        ? {
            id: campaign.id,
            titleEn: campaign.titleEn,
            titleFr: campaign.titleFr,
            titleAr: campaign.titleAr,
            date: campaign.date,
            locationEn: campaign.locationEn,
          }
        : null,
    };
  }),

  // Manually mark a registration as attended / not attended
  markAttendance: adminQuery
    .input(markAttendanceSchema)
    .mutation(async ({ input }) => {
      const db = getDb();

      const [registration] = await db
        .select()
        .from(campaignRegistrations)
        .where(eq(campaignRegistrations.id, input.registrationId))
        .limit(1);

      await db
        .update(campaignRegistrations)
        .set({ attended: input.attended })
        .where(eq(campaignRegistrations.id, input.registrationId));

      if (
        input.attended &&
        registration?.userId &&
        !(registration.attended ?? false)
      ) {
        const alreadyHasPoints = await hasAttendancePoints(
          registration.userId,
          registration.campaignId
        );
        if (!alreadyHasPoints) {
          await awardAttendancePoints(
            registration.userId,
            registration.campaignId
          );
        }
      }

      return { success: true };
    }),

  // List attendance for a campaign (registered users + their badge status)
  listAttendance: adminQuery
    .input(campaignIdSchema)
    .query(async ({ input }) => {
      const db = getDb();

      const regs = await db
        .select()
        .from(campaignRegistrations)
        .where(
          and(
            eq(campaignRegistrations.campaignId, input.campaignId),
            eq(campaignRegistrations.status, "registered")
          )
        )
        .orderBy(desc(campaignRegistrations.createdAt));

      const userIds = regs
        .map(r => r.userId)
        .filter((id): id is number => id !== null);

      const allUsers =
        userIds.length > 0
          ? await db.select().from(users).where(inArray(users.id, userIds))
          : [];

      const userMap = new Map(allUsers.map(u => [u.id, u]));

      return regs.map(reg => ({
        ...reg,
        user: reg.userId ? (userMap.get(reg.userId) ?? null) : null,
      }));
    }),
});
