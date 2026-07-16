import { z } from "zod";
import { or } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { volunteerRegistrations } from "@db/schema";
import { eq, desc, count, and, like } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";
import { checkRateLimit } from "./lib/rate-limit";
import { logActivity } from "./lib/activity";
import { upsertUser } from "./queries/users";

export const volunteerRouter = createRouter({
  // Public: submit volunteer registration (no auth required)
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(100).transform((s) => sanitizeString(s, 100)),
        email: z.string().email().max(255).transform((s) => sanitizeString(s, 255).toLowerCase()),
        phone: z.string().max(50).optional().transform((s) => s ? sanitizeString(s, 50) : undefined),
        message: z.string().max(1000).optional().transform((s) => s ? sanitizeString(s, 1000) : undefined),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ip = ctx.req.headers.get("x-forwarded-for") || ctx.req.headers.get("x-real-ip") || "unknown";
      if (!checkRateLimit(ip, 5)) {
        return { success: false, message: "Rate limit exceeded. Please try again later." };
      }

      const db = getDb();

      // Check if email already has a pending or approved registration
      const existing = await db
        .select()
        .from(volunteerRegistrations)
        .where(eq(volunteerRegistrations.email, input.email))
        .limit(1);

      if (existing[0] && existing[0].status !== "rejected") {
        return { success: false, message: "This email has already registered. Please wait for admin approval." };
      }

      await db.insert(volunteerRegistrations).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        status: "pending",
      });

      return { success: true, message: "Registration submitted. An admin will review your application." };
    }),

  // Admin: list all volunteer registrations with pagination and filter
  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.string().optional(),
        search: z.string().optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.status) {
        conditions.push(eq(volunteerRegistrations.status, input.status as "pending" | "approved" | "rejected"));
      }
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            like(volunteerRegistrations.name, searchTerm),
            like(volunteerRegistrations.email, searchTerm)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [list, totalResult] = await Promise.all([
        db
          .select()
          .from(volunteerRegistrations)
          .where(whereClause)
          .orderBy(desc(volunteerRegistrations.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(volunteerRegistrations)
          .where(whereClause),
      ]);

      return {
        volunteers: list,
        total: totalResult[0].count,
        page: input.page,
        totalPages: Math.ceil(totalResult[0].count / input.limit),
      };
    }),

  // Admin: update volunteer status (approve / reject)
  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const [volunteer] = await db
        .select()
        .from(volunteerRegistrations)
        .where(eq(volunteerRegistrations.id, input.id))
        .limit(1);

      if (!volunteer) {
        throw new Error("Volunteer registration not found");
      }

      // If approving, create a user account
      if (input.status === "approved" && volunteer.status !== "approved") {
        const unionId = `local:${volunteer.email}`;
        await upsertUser({
          unionId,
          name: volunteer.name,
          email: volunteer.email,
          role: "user",
          lastSignInAt: new Date(),
        });
      }

      await db
        .update(volunteerRegistrations)
        .set({ status: input.status })
        .where(eq(volunteerRegistrations.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: `volunteer.${input.status}`,
        entityType: "volunteer_registration",
        entityId: input.id,
        details: { name: volunteer.name, email: volunteer.email },
      });

      return { success: true };
    }),

  // Admin: delete a volunteer registration
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const [volunteer] = await db
        .select()
        .from(volunteerRegistrations)
        .where(eq(volunteerRegistrations.id, input.id))
        .limit(1);

      if (!volunteer) {
        throw new Error("Volunteer registration not found");
      }

      await db
        .delete(volunteerRegistrations)
        .where(eq(volunteerRegistrations.id, input.id));

      await logActivity({
        userId: ctx.user?.id,
        action: "volunteer.deleted",
        entityType: "volunteer_registration",
        entityId: input.id,
        details: { name: volunteer.name, email: volunteer.email },
      });

      return { success: true };
    }),

  // Admin: count pending volunteer registrations
  pendingCount: adminQuery.query(async () => {
    const db = getDb();
    const [result] = await db
      .select({ count: count() })
      .from(volunteerRegistrations)
      .where(eq(volunteerRegistrations.status, "pending"));
    return result.count;
  }),
});


