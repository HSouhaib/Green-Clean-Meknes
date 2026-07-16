import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { contacts } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { sanitizeString, sanitizeEmail } from "./lib/sanitize";
import { checkRateLimit } from "./lib/rate-limit";

// ===== ZOD SCHEMAS =====
const submitContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).transform((s) => sanitizeString(s, 255)),
  email: z.string().email("Invalid email address").max(320).transform(sanitizeEmail),
  message: z.string().min(1, "Message is required").max(5000).transform((s) => sanitizeString(s, 5000)),
});

const contactIdSchema = z.object({
  id: z.number().int().positive(),
});

const updateStatusSchema = z.object({
  id: z.number().int().positive(),
  isRead: z.boolean().optional(),
  isReplied: z.boolean().optional(),
});

// ===== ROUTER =====
export const contactRouter = createRouter({
  submit: publicQuery
    .input(submitContactSchema)
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers.get("x-forwarded-for") ?? "unknown";
      if (!checkRateLimit(ip)) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      const db = getDb();
      const result = db.insert(contacts).values({
        name: input.name,
        email: input.email,
        message: input.message,
      }).run();
      return { id: result.lastInsertRowid, success: true };
    }),

  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }),

  getById: adminQuery
    .input(contactIdSchema)
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db.select().from(contacts).where(eq(contacts.id, input.id)).limit(1);
      return result[0] ?? null;
    }),

  updateStatus: adminQuery
    .input(updateStatusSchema)
    .mutation(async ({ input }) => {
      const { id, ...status } = input;
      const db = getDb();
      await db.update(contacts).set(status).where(eq(contacts.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(contactIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(contacts).where(eq(contacts.id, input.id));
      return { success: true };
    }),

  unreadCount: adminQuery.query(async () => {
    const db = getDb();
    const result = await db.select().from(contacts).where(eq(contacts.isRead, false));
    return result.length;
  }),

  // File upload endpoint
  uploadImage: adminQuery
    .input(z.object({
      data: z.string(),
      filename: z.string().regex(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i),
    }))
    .mutation(async ({ input }) => {
      const base64Data = input.data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error("File too large (max 5MB)");
      }
      const assetsDir = join(process.cwd(), "public", "assets");
      mkdirSync(assetsDir, { recursive: true });
      const filepath = join(assetsDir, input.filename);
      writeFileSync(filepath, buffer);
      return { url: `/assets/${input.filename}` };
    }),
});
