import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// The runtime app uses better-sqlite3; ensure drizzle-kit targets SQLite.
const sqliteUrl = connectionString.startsWith("file:")
  ? connectionString
  : `file:${connectionString}`;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: sqliteUrl,
  },
});
