import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { contactRouter } from "./contact-router";

describe("contact router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Public: submit contact form
  describe("submit", () => {
    it("creates a contact submission", async () => {
      const caller = contactRouter.createCaller(createTestContext());
      const result = await caller.submit({
        name: "John Doe",
        email: "john@example.com",
        message: "Hello, I want to help!",
      });

      expect(result.success).toBe(true);

      const contacts = testDb.client.prepare("SELECT * FROM contacts").all();
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe("John Doe");
      expect(contacts[0].email).toBe("john@example.com");
    });

    it("rejects invalid email", async () => {
      const caller = contactRouter.createCaller(createTestContext());
      await expect(
        caller.submit({
          name: "John",
          email: "not-an-email",
          message: "Hello",
        })
      ).rejects.toThrow();
    });

    it("sanitizes XSS characters from input", async () => {
      const caller = contactRouter.createCaller(createTestContext());
      await caller.submit({
        name: "<script>alert('xss')</script>John",
        email: "john@example.com",
        message: "<img src=x onerror=alert(1)>Hello",
      });

      const contact = testDb.client.prepare("SELECT * FROM contacts").get();
      expect(contact.name).not.toContain("<");
      expect(contact.message).not.toContain("<");
    });
  });

  // Admin: list
  describe("list", () => {
    it("returns all contacts as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`
      ).run("Alice", "alice@example.com", "Message 1");
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`
      ).run("Bob", "bob@example.com", "Message 2");

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = contactRouter.createCaller(createTestContext(admin));
      const result = await caller.list();

      expect(result).toHaveLength(2);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = contactRouter.createCaller(createTestContext(user));
      await expect(caller.list()).rejects.toThrow("Insufficient permissions");
    });
  });

  // Admin: updateStatus
  describe("updateStatus", () => {
    it("updates contact status", async () => {
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message, is_read) VALUES (?, ?, ?, ?)`
      ).run("Alice", "alice@example.com", "Message", 0);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = contactRouter.createCaller(createTestContext(admin));

      const contact = testDb.client.prepare("SELECT id FROM contacts").get();
      await caller.updateStatus({ id: contact.id, isRead: true });

      const updated = testDb.client.prepare("SELECT is_read FROM contacts WHERE id = ?").get(contact.id);
      expect(updated.is_read).toBe(1);
    });
  });

  // Admin: delete
  describe("delete", () => {
    it("deletes a contact as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`
      ).run("Alice", "alice@example.com", "Message");

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = contactRouter.createCaller(createTestContext(admin));

      const contact = testDb.client.prepare("SELECT id FROM contacts").get();
      await caller.delete({ id: contact.id });

      const remaining = testDb.client.prepare("SELECT * FROM contacts").all();
      expect(remaining).toHaveLength(0);
    });
  });

  // Admin: unreadCount
  describe("unreadCount", () => {
    it("returns count of unread contacts", async () => {
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message, is_read) VALUES (?, ?, ?, ?)`
      ).run("Alice", "alice@example.com", "Message", 0);
      testDb.client.prepare(
        `INSERT INTO contacts (name, email, message, is_read) VALUES (?, ?, ?, ?)`
      ).run("Bob", "bob@example.com", "Message", 1);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = contactRouter.createCaller(createTestContext(admin));
      const count = await caller.unreadCount();

      expect(count).toBe(1);
    });
  });
});
