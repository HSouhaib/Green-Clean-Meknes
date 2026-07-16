import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { siteSettings } from "@db/schema";
import { eq } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";

export const settingsRouter = createRouter({
  // Public: get all settings as a key-value map
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value ?? "";
    }
    return map;
  }),

  // Public: get a single setting
  get: publicQuery
    .input(z.object({ key: z.string().transform((s) => sanitizeString(s, 255)) }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .limit(1);
      return result[0]?.value ?? null;
    }),

  // Admin: update a setting
  update: adminQuery
    .input(z.object({
      key: z.string().min(1).transform((s) => sanitizeString(s, 255)),
      value: z.string().transform((s) => sanitizeString(s, 5000)),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, input.key))
        .limit(1);

      if (existing[0]) {
        await db
          .update(siteSettings)
          .set({ value: input.value, updatedAt: new Date() })
          .where(eq(siteSettings.key, input.key));
      } else {
        await db.insert(siteSettings).values({
          key: input.key,
          value: input.value,
        });
      }
      return { success: true };
    }),

  // Admin: batch update settings
  updateMany: adminQuery
    .input(z.record(z.string().transform((s) => sanitizeString(s, 255)), z.string().transform((s) => sanitizeString(s, 5000))))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const [key, value] of Object.entries(input)) {
        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, key))
          .limit(1);
        if (existing[0]) {
          await db
            .update(siteSettings)
            .set({ value, updatedAt: new Date() })
            .where(eq(siteSettings.key, key));
        } else {
          await db.insert(siteSettings).values({ key, value });
        }
      }
      return { success: true };
    }),
});
