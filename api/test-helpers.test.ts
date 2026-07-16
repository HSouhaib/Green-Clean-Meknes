import { describe, it, expect } from "vitest";
import { createTestDb } from "./test-helpers";

describe("test-helpers", () => {
  it("creates an in-memory database", () => {
    const { db, client } = createTestDb();
    expect(db).toBeDefined();
    expect(client).toBeDefined();

    // Verify we can query
    const result = client.prepare("SELECT 1 as test").get();
    expect(result.test).toBe(1);
  });
});
