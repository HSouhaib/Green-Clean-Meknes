import "dotenv/config";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "local.db";
  return url.startsWith("file:") ? url.slice(5) : url;
}

function isAlreadyAppliedError(message: string): boolean {
  const patterns = [
    /duplicate column name/i,
    /table .* already exists/i,
    /index .* already exists/i,
    /no such column/i,
  ];
  return patterns.some((p) => p.test(message));
}

async function migrate() {
  const dbPath = getDbPath();
  console.log(`Running migrations on ${dbPath}`);
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  const appliedRows = db.prepare("SELECT filename FROM __migrations").all() as { filename: string }[];
  const applied = new Set(appliedRows.map((r) => r.filename));

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    db.close();
    return;
  }

  const applyMigration = db.transaction((sql: string) => {
    db.exec(sql);
  });

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    try {
      applyMigration(sql);
      db.prepare("INSERT INTO __migrations (filename) VALUES (?)").run(file);
      console.log(`Applied ${file}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isAlreadyAppliedError(message)) {
        console.warn(`Skipping ${file}: appears already applied (${message})`);
        db.prepare("INSERT OR IGNORE INTO __migrations (filename) VALUES (?)").run(file);
      } else {
        db.close();
        throw new Error(`Migration ${file} failed: ${message}`);
      }
    }
  }

  console.log("Migrations complete.");
  db.close();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
