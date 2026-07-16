import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { testimonials } from "@db/schema";
import { eq } from "drizzle-orm";

import { sanitizeString } from "./lib/sanitize";
import { safeUrl } from "./lib/zod-helpers";

const testimonialIdSchema = z.object({
  id: z.number().int().positive(),
});

const createTestimonialSchema = z.object({
  name: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
  nameAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  role: z.string().min(1).max(255).transform((s) => sanitizeString(s, 255)),
  roleAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  roleFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  quoteEn: z.string().min(1).max(2000).transform((s) => sanitizeString(s, 2000)),
  quoteAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  quoteFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  avatar: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  sortOrder: z.number().int().default(0),
});

const updateTestimonialSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  nameFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  role: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  roleAr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  roleFr: z.string().max(255).optional().transform((s) => s ? sanitizeString(s, 255) : undefined),
  quoteEn: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  quoteAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  quoteFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  avatar: safeUrl(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const testimonialRouter = createRouter({
  // Public: list active testimonials
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(testimonials.sortOrder);
  }),

  // Admin: list all testimonials
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(testimonials)
      .orderBy(testimonials.sortOrder);
  }),

  // Admin: create testimonial
  create: adminQuery
    .input(createTestimonialSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db.insert(testimonials).values(input).run();
      return { id: result.lastInsertRowid };
    }),

  // Admin: update testimonial
  update: adminQuery
    .input(updateTestimonialSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(testimonials).set(data).where(eq(testimonials.id, id));
      return { success: true };
    }),

  // Admin: delete testimonial
  delete: adminQuery
    .input(testimonialIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(testimonials).where(eq(testimonials.id, input.id));
      return { success: true };
    }),

  // Admin: toggle active status
  toggleActive: adminQuery
    .input(testimonialIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.id, input.id))
        .limit(1);
      if (!result[0]) throw new Error("Testimonial not found");
      await db
        .update(testimonials)
        .set({ isActive: !result[0].isActive })
        .where(eq(testimonials.id, input.id));
      return { success: true, isActive: !result[0].isActive };
    }),
});
