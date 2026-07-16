import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, createTestUser, createTestContext, seedTestData } from "./test-helpers";
import { setTestDb, clearTestDb } from "./queries/connection";
import { pollRouter } from "./poll-router";

describe("poll router", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    seedTestData(testDb.db);
    setTestDb(testDb.db);
  });

  afterEach(() => {
    clearTestDb();
  });

  // Public: getActive
  describe("getActive", () => {
    it("returns null when no active polls exist", async () => {
      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.getActive();
      expect(result).toBeNull();
    });

    it("returns the active poll", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("What area needs cleaning?", '["Old Medina","Place el-Hedim"]', 1);

      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.getActive();
      expect(result).not.toBeNull();
      expect(result?.question).toBe("What area needs cleaning?");
      expect(result?.options).toEqual(["Old Medina", "Place el-Hedim"]);
    });

    it("returns the most recently created active poll", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active, created_at) VALUES (?, ?, ?, unixepoch() - 100)`
      ).run("Old Question", '["A","B"]', 1);
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active, created_at) VALUES (?, ?, ?, unixepoch())`
      ).run("New Question", '["C","D"]', 1);

      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.getActive();
      expect(result?.question).toBe("New Question");
    });
  });

  // Public: getResults
  describe("getResults", () => {
    it("returns zero counts for poll with no votes", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Test Poll", '["Option A","Option B"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.getResults({ pollId: poll.id });

      expect(result.totalVotes).toBe(0);
      expect(result.counts).toEqual([0, 0]);
    });

    it("counts votes correctly", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Test Poll", '["Option A","Option B","Option C"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      testDb.client.prepare(
        `INSERT INTO poll_votes (poll_id, option_index, ip_hash) VALUES (?, ?, ?)`
      ).run(poll.id, 0, "hash1");
      testDb.client.prepare(
        `INSERT INTO poll_votes (poll_id, option_index, ip_hash) VALUES (?, ?, ?)`
      ).run(poll.id, 0, "hash2");
      testDb.client.prepare(
        `INSERT INTO poll_votes (poll_id, option_index, ip_hash) VALUES (?, ?, ?)`
      ).run(poll.id, 1, "hash3");

      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.getResults({ pollId: poll.id });

      expect(result.totalVotes).toBe(3);
      expect(result.counts).toEqual([2, 1, 0]);
    });
  });

  // Public: vote
  describe("vote", () => {
    it("allows a user to vote", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Test Poll", '["Option A","Option B"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.vote({ pollId: poll.id, optionIndex: 0 });

      expect(result.success).toBe(true);

      const votes = testDb.client.prepare("SELECT * FROM poll_votes").all();
      expect(votes).toHaveLength(1);
    });

    it("prevents duplicate voting from same IP", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Test Poll", '["Option A","Option B"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      const caller = pollRouter.createCaller(createTestContext());

      // First vote
      await caller.vote({ pollId: poll.id, optionIndex: 0 });
      // Second vote from same IP should fail
      const result = await caller.vote({ pollId: poll.id, optionIndex: 1 });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Already voted");
    });

    it("rejects voting on inactive poll", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Test Poll", '["Option A","Option B"]', 0);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      const caller = pollRouter.createCaller(createTestContext());
      const result = await caller.vote({ pollId: poll.id, optionIndex: 0 });

      expect(result.success).toBe(false);
    });
  });

  // Admin: listAll
  describe("listAll", () => {
    it("returns all polls with vote counts as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Poll 1", '["A","B"]', 1);
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Poll 2", '["C","D"]', 0);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = pollRouter.createCaller(createTestContext(admin));
      const result = await caller.listAll();

      expect(result).toHaveLength(2);
    });

    it("rejects non-admin users", async () => {
      const user = createTestUser(testDb.db, { role: "user" });
      const caller = pollRouter.createCaller(createTestContext(user));
      await expect(caller.listAll()).rejects.toThrow("Insufficient permissions");
    });
  });

  // Admin: create
  describe("create", () => {
    it("creates a poll and deactivates others as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Old Poll", '["A","B"]', 1);

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = pollRouter.createCaller(createTestContext(admin));

      const result = await caller.create({
        question: "New Poll",
        options: ["Option A", "Option B"],
      });

      expect(result.id).toBeDefined();

      // Old poll should be deactivated
      const oldPoll = testDb.client.prepare("SELECT is_active FROM polls WHERE question = ?").get("Old Poll");
      expect(oldPoll.is_active).toBe(0);

      // New poll should be active
      const newPoll = testDb.client.prepare("SELECT is_active FROM polls WHERE id = ?").get(result.id);
      expect(newPoll.is_active).toBe(1);
    });
  });

  // Admin: delete
  describe("delete", () => {
    it("deletes a poll and its votes as admin", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("To Delete", '["A","B"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      testDb.client.prepare(
        `INSERT INTO poll_votes (poll_id, option_index, ip_hash) VALUES (?, ?, ?)`
      ).run(poll.id, 0, "hash1");

      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = pollRouter.createCaller(createTestContext(admin));

      await caller.delete({ id: poll.id });

      const remainingPolls = testDb.client.prepare("SELECT * FROM polls").all();
      expect(remainingPolls).toHaveLength(0);

      const remainingVotes = testDb.client.prepare("SELECT * FROM poll_votes").all();
      expect(remainingVotes).toHaveLength(0);
    });
  });

  // Admin: toggleActive
  describe("toggleActive", () => {
    it("toggles poll active status", async () => {
      testDb.client.prepare(
        `INSERT INTO polls (question, options, is_active) VALUES (?, ?, ?)`
      ).run("Toggle Poll", '["A","B"]', 1);

      const poll = testDb.client.prepare("SELECT id FROM polls").get();
      const admin = createTestUser(testDb.db, { role: "admin" });
      const caller = pollRouter.createCaller(createTestContext(admin));

      const result = await caller.toggleActive({ id: poll.id });
      expect(result.isActive).toBe(false);

      const updated = testDb.client.prepare("SELECT is_active FROM polls WHERE id = ?").get(poll.id);
      expect(updated.is_active).toBe(0);
    });
  });
});
