import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { testimonialRouter } from "./testimonial-router";

describe("testimonial router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Public: list
  describe("list", () => {
    it("returns only active testimonials", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`
      ).run("Alice", "Volunteer", "Great!", 1, 0);
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`
      ).run("Bob", "Coordinator", "Nice!", 0, 1);

      const caller = testimonialRouter.createCaller(createTestContext());
      const result = await caller.list();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice");
    });

    it("returns testimonials sorted by sort_order", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`
      ).run("Third", "Role", "Quote", 1, 2);
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`
      ).run("First", "Role", "Quote", 1, 0);
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active, sort_order) VALUES (?, ?, ?, ?, ?)`
      ).run("Second", "Role", "Quote", 1, 1);

      const caller = testimonialRouter.createCaller(createTestContext());
      const result = await caller.list();

      expect(result[0].name).toBe("First");
      expect(result[1].name).toBe("Second");
      expect(result[2].name).toBe("Third");
    });
  });

  // Admin: listAll
  describe("listAll", () => {
    it("returns all testimonials as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active) VALUES (?, ?, ?, ?)`
      ).run("Alice", "Volunteer", "Great!", 1);
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active) VALUES (?, ?, ?, ?)`
      ).run("Bob", "Coordinator", "Nice!", 0);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = testimonialRouter.createCaller(createTestContext(admin));
      const result = await caller.listAll();

      expect(result).toHaveLength(2);
    });
  });

  // Admin: create
  describe("create", () => {
    it("creates a testimonial as admin", async () => {
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = testimonialRouter.createCaller(createTestContext(admin));

      const result = await caller.create({
        name: "John Doe",
        role: "Volunteer",
        quoteEn: "Amazing experience!",
      });

      expect(result.id).toBeDefined();

      const testimonial = testDb.client.prepare("SELECT * FROM testimonials WHERE id = ?").get(result.id);
      expect(testimonial.name).toBe("John Doe");
      expect(testimonial.quote_en).toBe("Amazing experience!");
    });
  });

  // Admin: update
  describe("update", () => {
    it("updates a testimonial as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active) VALUES (?, ?, ?, ?)`
      ).run("Old Name", "Role", "Old Quote", 1);

      const testimonial = testDb.client.prepare("SELECT id FROM testimonials").get();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = testimonialRouter.createCaller(createTestContext(admin));

      await caller.update({
        id: testimonial.id,
        name: "New Name",
        quoteEn: "New Quote",
      });

      const updated = testDb.client.prepare("SELECT name, quote_en FROM testimonials WHERE id = ?").get(testimonial.id);
      expect(updated.name).toBe("New Name");
      expect(updated.quote_en).toBe("New Quote");
    });
  });

  // Admin: delete
  describe("delete", () => {
    it("deletes a testimonial as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active) VALUES (?, ?, ?, ?)`
      ).run("To Delete", "Role", "Quote", 1);

      const testimonial = testDb.client.prepare("SELECT id FROM testimonials").get();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = testimonialRouter.createCaller(createTestContext(admin));

      await caller.delete({ id: testimonial.id });

      const remaining = testDb.client.prepare("SELECT * FROM testimonials").all();
      expect(remaining).toHaveLength(0);
    });
  });

  // Admin: toggleActive
  describe("toggleActive", () => {
    it("toggles testimonial active status", async () => {
      testDb.client.prepare(
        `INSERT INTO testimonials (name, role, quote_en, is_active) VALUES (?, ?, ?, ?)`
      ).run("Toggle Me", "Role", "Quote", 1);

      const testimonial = testDb.client.prepare("SELECT id FROM testimonials").get();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = testimonialRouter.createCaller(createTestContext(admin));

      const result = await caller.toggleActive({ id: testimonial.id });
      expect(result.isActive).toBe(false);

      const updated = testDb.client.prepare("SELECT is_active FROM testimonials WHERE id = ?").get(testimonial.id);
      expect(updated.is_active).toBe(0);
    });
  });
});
