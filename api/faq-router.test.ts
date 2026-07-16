import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { faqRouter } from "./faq-router";

function uniqueQuestion(base: string) {
  return `${base} ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`;
}

describe("faq router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  describe("list", () => {
    it("returns only active FAQs", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = faqRouter.createCaller(createTestContext(admin));

      await caller.create({
        questionEn: uniqueQuestion("Active Q"),
        answerEn: "Active answer",
        sortOrder: 1,
      });

      await caller.create({
        questionEn: uniqueQuestion("Inactive Q"),
        answerEn: "Inactive answer",
        sortOrder: 2,
      });

      const all = await caller.listAll();
      const inactive = all.find((f) => f.questionEn.startsWith("Inactive"));
      await caller.toggleActive({ id: inactive!.id });

      const publicCaller = faqRouter.createCaller(createTestContext());
      const result = await publicCaller.list();
      expect(result).toHaveLength(1);
      expect(result[0].questionEn).toContain("Active");
    });
  });

  describe("create", () => {
    it("creates a FAQ as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = faqRouter.createCaller(createTestContext(admin));

      const result = await caller.create({
        questionEn: uniqueQuestion("Test question"),
        answerEn: "Test answer",
        sortOrder: 1,
      });

      expect(result.id).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = faqRouter.createCaller(createTestContext(user));
      await expect(
        caller.create({ questionEn: uniqueQuestion("Test"), answerEn: "Answer", sortOrder: 0 })
      ).rejects.toThrow("Insufficient permissions");
    });
  });

  describe("update", () => {
    it("updates a FAQ as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = faqRouter.createCaller(createTestContext(admin));

      const created = await caller.create({
        questionEn: uniqueQuestion("Original"),
        answerEn: "Original answer",
        sortOrder: 1,
      });

      await caller.update({
        id: created.id as number,
        questionEn: "Updated question",
      });

      const result = await caller.listAll();
      const updated = result.find((f) => f.id === created.id);
      expect(updated?.questionEn).toBe("Updated question");
    });
  });

  describe("delete", () => {
    it("deletes a FAQ as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = faqRouter.createCaller(createTestContext(admin));

      const created = await caller.create({
        questionEn: uniqueQuestion("To delete"),
        answerEn: "Delete me",
        sortOrder: 1,
      });

      await caller.delete({ id: created.id as number });
      const result = await caller.listAll();
      expect(result.find((f) => f.id === created.id)).toBeUndefined();
    });
  });

  describe("toggleActive", () => {
    it("toggles FAQ active status", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = faqRouter.createCaller(createTestContext(admin));

      const created = await caller.create({
        questionEn: uniqueQuestion("Toggle"),
        answerEn: "Toggle me",
        sortOrder: 1,
      });

      const result = await caller.toggleActive({ id: created.id as number });
      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
    });
  });
});
