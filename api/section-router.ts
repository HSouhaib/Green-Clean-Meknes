import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sectionVisibility, sectionOrder } from "@db/schema";
import { eq } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";

export const sectionRouter = createRouter({
  // Public: get all section visibility settings
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(sectionVisibility);
  }),

  // Public: get section order
  getOrder: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(sectionOrder).orderBy(sectionOrder.sortOrder);
  }),

  // Admin: toggle section visibility
  toggle: adminQuery
    .input(z.object({
      sectionKey: z.string().min(1).transform((s) => sanitizeString(s, 255)),
      isVisible: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(sectionVisibility)
        .set({ isVisible: input.isVisible, updatedAt: new Date() })
        .where(eq(sectionVisibility.sectionKey, input.sectionKey));
      return { success: true };
    }),

  // Admin: update section order (drag-to-reorder)
  updateOrder: adminQuery
    .input(z.array(z.object({ sectionKey: z.string().transform((s) => sanitizeString(s, 255)), sortOrder: z.number() })))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const item of input) {
        const existing = await db
          .select()
          .from(sectionOrder)
          .where(eq(sectionOrder.sectionKey, item.sectionKey))
          .limit(1);

        if (existing[0]) {
          await db
            .update(sectionOrder)
            .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
            .where(eq(sectionOrder.sectionKey, item.sectionKey));
        } else {
          await db.insert(sectionOrder).values({
            sectionKey: item.sectionKey,
            sortOrder: item.sortOrder,
          });
        }
      }
      return { success: true };
    }),
});
