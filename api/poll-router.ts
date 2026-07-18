import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { polls, pollVotes } from "@db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { sanitizeString } from "./lib/sanitize";
import { checkRateLimit } from "./lib/rate-limit";

// Poll input schemas
const createPollSchema = z.object({
  question: z.string().min(1).max(500).transform((s) => sanitizeString(s, 500)),
  questionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  options: z.array(z.string().min(1).max(200).transform((s) => sanitizeString(s, 200))).min(2).max(10),
  optionsAr: z.array(z.string().max(200).transform((s) => sanitizeString(s, 200))).optional(),
  optionsFr: z.array(z.string().max(200).transform((s) => sanitizeString(s, 200))).optional(),
});

const updatePollSchema = z.object({
  id: z.number().int().positive(),
  question: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionAr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  questionFr: z.string().max(500).optional().transform((s) => s ? sanitizeString(s, 500) : undefined),
  options: z.array(z.string().min(1).max(200).transform((s) => sanitizeString(s, 200))).min(2).max(10).optional(),
  optionsAr: z.array(z.string().max(200).transform((s) => sanitizeString(s, 200))).optional(),
  optionsFr: z.array(z.string().max(200).transform((s) => sanitizeString(s, 200))).optional(),
  isActive: z.boolean().optional(),
});

const pollIdSchema = z.object({
  id: z.number().int().positive(),
});

const voteSchema = z.object({
  pollId: z.number().int().positive(),
  optionIndex: z.number().int().min(0),
});

// Helper to hash IP for anonymous vote tracking
function hashIp(ip: string | undefined): string {
  if (!ip) return "anonymous";
  // Simple hash - not cryptographically secure but sufficient for this use case
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
}

export const pollRouter = createRouter({
  // Public: get the currently active poll
  getActive: publicQuery.query(async () => {
    const db = getDb();

    const result = await db
      .select()
      .from(polls)
      .where(eq(polls.isActive, true))
      .orderBy(desc(polls.createdAt))
      .limit(1);

    if (!result[0]) return null;

    return {
      id: result[0].id,
      question: result[0].question,
      questionAr: result[0].questionAr,
      questionFr: result[0].questionFr,
      options: JSON.parse(result[0].options || '[]'),
      optionsAr: JSON.parse(result[0].optionsAr || '[]'),
      optionsFr: JSON.parse(result[0].optionsFr || '[]'),
      isActive: result[0].isActive,
      createdAt: result[0].createdAt,
    };
  }),

  // Public: get results for a poll
  getResults: publicQuery
    .input(z.object({ pollId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = getDb();

      // Get poll to know option count
      const pollResult = await db
        .select({ options: polls.options })
        .from(polls)
        .where(eq(polls.id, input.pollId))
        .limit(1);

      if (!pollResult[0]) return { totalVotes: 0, counts: [] };

      const optionCount = JSON.parse(pollResult[0].options || '[]').length;

      // Count votes per option using Drizzle ORM
      const voteRows = await db
        .select({ optionIndex: pollVotes.optionIndex, count: count() })
        .from(pollVotes)
        .where(eq(pollVotes.pollId, input.pollId))
        .groupBy(pollVotes.optionIndex);

      const counts: number[] = new Array(optionCount).fill(0);
      for (const row of voteRows) {
        if (row.optionIndex < optionCount) {
          counts[row.optionIndex] = Number(row.count);
        }
      }

      const totalVotes = counts.reduce((a, b) => a + b, 0);

      return { totalVotes, counts };
    }),

  // Public: vote on a poll
  vote: publicQuery
    .input(voteSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Rate limit check
      const ip = ctx.req.headers.get("x-forwarded-for") ||
        ctx.req.headers.get("x-real-ip") ||
        "unknown";
      if (!checkRateLimit(ip)) {
        return { success: false, message: "Rate limit exceeded. Please try again later." };
      }

      // Check if poll exists and is active
      const pollResult = await db
        .select({ id: polls.id, options: polls.options, isActive: polls.isActive })
        .from(polls)
        .where(eq(polls.id, input.pollId))
        .limit(1);

      if (!pollResult[0] || !pollResult[0].isActive) {
        return { success: false, message: "Poll not found or inactive" };
      }

      const options = JSON.parse(pollResult[0].options || '[]');
      if (input.optionIndex >= options.length) {
        return { success: false, message: "Invalid option" };
      }

      // Hash IP for anonymous tracking (one vote per IP per poll)
      const ipHash = hashIp(
        ctx.req.headers.get("x-forwarded-for") ||
        ctx.req.headers.get("x-real-ip") ||
        undefined
      );

      // Check if already voted
      const existing = await db
        .select({ id: pollVotes.id })
        .from(pollVotes)
        .where(
          and(eq(pollVotes.pollId, input.pollId), eq(pollVotes.ipHash, ipHash))
        )
        .limit(1);

      if (existing[0]) {
        return { success: false, message: "Already voted" };
      }

      // Insert vote
      await db.insert(pollVotes).values({
        pollId: input.pollId,
        optionIndex: input.optionIndex,
        ipHash,
      });

      return { success: true };
    }),

  // Admin: list all polls
  listAll: adminQuery.query(async () => {
    const db = getDb();

    const rows = await db
      .select()
      .from(polls)
      .orderBy(desc(polls.createdAt));

    // Get vote counts per poll by querying all votes and aggregating in JS
    const allVotes = await db.select({ pollId: pollVotes.pollId }).from(pollVotes);
    const voteCountMap = new Map<number, number>();
    for (const vote of allVotes) {
      voteCountMap.set(vote.pollId, (voteCountMap.get(vote.pollId) ?? 0) + 1);
    }

    return rows.map((r) => ({
      id: r.id,
      question: r.question,
      questionAr: r.questionAr,
      questionFr: r.questionFr,
      options: JSON.parse(r.options || '[]'),
      optionsAr: JSON.parse(r.optionsAr || '[]'),
      optionsFr: JSON.parse(r.optionsFr || '[]'),
      isActive: r.isActive,
      voteCount: voteCountMap.get(r.id) ?? 0,
      createdAt: r.createdAt,
    }));
  }),

  // Admin: create poll
  create: adminQuery
    .input(createPollSchema)
    .mutation(async ({ input }) => {
      const db = getDb();

      // Deactivate all other polls first
      await db.update(polls).set({ isActive: false }).where(eq(polls.isActive, true));

      const result = await db.insert(polls).values({
        question: input.question,
        questionAr: input.questionAr ?? null,
        questionFr: input.questionFr ?? null,
        options: JSON.stringify(input.options),
        optionsAr: input.optionsAr ? JSON.stringify(input.optionsAr) : null,
        optionsFr: input.optionsFr ? JSON.stringify(input.optionsFr) : null,
        isActive: true,
      });

      return { id: Number(result.lastInsertRowid) };
    }),

  // Admin: update poll
  update: adminQuery
    .input(updatePollSchema)
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;

      const updateData: Record<string, unknown> = {};
      if (data.question !== undefined) updateData.question = data.question;
      if (data.questionAr !== undefined) updateData.questionAr = data.questionAr;
      if (data.questionFr !== undefined) updateData.questionFr = data.questionFr;
      if (data.options !== undefined) updateData.options = JSON.stringify(data.options);
      if (data.optionsAr !== undefined) updateData.optionsAr = JSON.stringify(data.optionsAr);
      if (data.optionsFr !== undefined) updateData.optionsFr = JSON.stringify(data.optionsFr);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      if (Object.keys(updateData).length === 0) return { success: true };

      await db.update(polls).set(updateData).where(eq(polls.id, id));

      return { success: true };
    }),

  // Admin: delete poll
  delete: adminQuery
    .input(pollIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();

      await db.delete(pollVotes).where(eq(pollVotes.pollId, input.id));
      await db.delete(polls).where(eq(polls.id, input.id));

      return { success: true };
    }),

  // Admin: toggle poll active status
  toggleActive: adminQuery
    .input(pollIdSchema)
    .mutation(async ({ input }) => {
      const db = getDb();

      const pollResult = await db
        .select({ isActive: polls.isActive })
        .from(polls)
        .where(eq(polls.id, input.id))
        .limit(1);

      if (!pollResult[0]) throw new Error("Poll not found");

      const newActive = !pollResult[0].isActive;

      if (newActive) {
        // Deactivate all others
        await db.update(polls).set({ isActive: false }).where(eq(polls.isActive, true));
      }

      await db.update(polls).set({ isActive: newActive }).where(eq(polls.id, input.id));

      return { success: true, isActive: newActive };
    }),
});
