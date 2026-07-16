import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;
let testInstance: ReturnType<typeof drizzle<typeof fullSchema>> | null = null;

export function getDb() {
  // If a test database is set, use it
  if (testInstance) {
    return testInstance;
  }
  
  if (!instance) {
    const client = new (Database as any)("local.db");
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}

/**
 * Set a test database instance. Used in tests to override the production DB.
 */
export function setTestDb(db: ReturnType<typeof drizzle<typeof fullSchema>>) {
  testInstance = db;
}

/**
 * Clear the test database instance. Call this after tests.
 */
export function clearTestDb() {
  testInstance = null;
}
