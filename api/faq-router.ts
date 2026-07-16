import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { faqs } from "@db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";

// ===== ZOD SCHEMAS =====
const faqIdSchema = z.object({
  id: z.number().int().positive(),
});

const createFaqSchema = z.object({
  questionEn: z.string().min(1).max(500).transform((s) => sanitizeString(s, 500)),
  questionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  answerEn: z.string().min(1).max(2000).transform((s) => sanitizeString(s, 2000)),
  answerFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  answerAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  sortOrder: z.number().int().min(0).default(0),
});

const updateFaqSchema = z.object({
  id: z.number().int().positive(),
  questionEn: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  answerEn: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  answerFr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  answerAr: z.string().max(2000).optional().transform((s) => s ? sanitizeString(s, 2000) : undefined),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ===== ROUTER =====
export const faqRouter = createRouter({
  // Public: list all active FAQs ordered by sortOrder
  list: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(asc(faqs.sortOrder), desc(faqs.createdAt));
  }),

  // Admin: list all (including inactive)
  listAll: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(faqs).orderBy(asc(faqs.sortOrder), desc(faqs.createdAt));
  }),

  // Admin: create
  create: adminQuery
    .input(createFaqSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db.insert(faqs).values(input).run();
      return { id: result.lastInsertRowid, success: true };
    }),

  // Admin: update
  update: adminQuery
    .input(updateFaqSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const db = getDb();
      await db.update(faqs).set(data).where(eq(faqs.id, id));
      return { success: true };
    }),

  // Admin: delete
  delete: adminQuery
    .input(faqIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(faqs).where(eq(faqs.id, input.id));
      return { success: true };
    }),

  // Admin: toggle active
  toggleActive: adminQuery
    .input(faqIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(faqs).where(eq(faqs.id, input.id)).limit(1);
      if (!existing[0]) throw new Error("Not found");
      const newState = !existing[0].isActive;
      await db.update(faqs)
        .set({ isActive: newState })
        .where(eq(faqs.id, input.id));
      return { success: true, isActive: newState };
    }),
});
