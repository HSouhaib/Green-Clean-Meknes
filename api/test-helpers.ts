import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as relations from "@db/relations";
import * as schema from "@db/schema";
import type { User } from "@db/schema";
import type { TrpcContext } from "./context";

interface SqliteClient {
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number | bigint };
  };
}

/**
 * Create an in-memory SQLite database for testing.
 * Returns a Drizzle ORM instance with all tables created.
 */
export function createTestDb() {
  const client = new Database(":memory:");
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  // Create all tables using raw SQL (same as seed.ts)
  client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unionId TEXT NOT NULL UNIQUE,
      name TEXT,
      email TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      two_factor_secret TEXT,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_backup_codes TEXT,
      createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
      updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
      lastSignInAt INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_fr TEXT,
      title_ar TEXT,
      location_en TEXT NOT NULL,
      location_fr TEXT,
      location_ar TEXT,
      description_en TEXT NOT NULL,
      description_fr TEXT,
      description_ar TEXT,
      date TEXT NOT NULL,
      event_date INTEGER,
      slug TEXT NOT NULL UNIQUE,
      gallery_images TEXT,
      filter_tags TEXT NOT NULL DEFAULT 'all',
      map_x REAL,
      map_y REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
      stats_waste_kg INTEGER DEFAULT 0,
      stats_trees INTEGER DEFAULT 0,
      stats_volunteers INTEGER DEFAULT 0,
      stats_neighborhoods INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      is_replied INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS section_visibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL UNIQUE,
      is_visible INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS campaign_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      user_id INTEGER,
      guest_name TEXT,
      guest_email TEXT,
      status TEXT NOT NULL DEFAULT 'registered',
      attended INTEGER NOT NULL DEFAULT 0,
      waste_kg INTEGER DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT,
      name_fr TEXT,
      role TEXT NOT NULL,
      role_ar TEXT,
      role_fr TEXT,
      quote_en TEXT NOT NULL,
      quote_ar TEXT,
      quote_fr TEXT,
      avatar TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      question_ar TEXT,
      question_fr TEXT,
      options TEXT NOT NULL,
      options_ar TEXT,
      options_fr TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_index INTEGER NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_fr TEXT,
      name_ar TEXT,
      slug TEXT NOT NULL UNIQUE,
      description_en TEXT NOT NULL,
      description_fr TEXT,
      description_ar TEXT,
      image TEXT,
      stats_waste_kg INTEGER DEFAULT 0,
      stats_trees INTEGER DEFAULT 0,
      stats_volunteers INTEGER DEFAULT 0,
      stats_campaigns INTEGER DEFAULT 0,
      map_x REAL,
      map_y REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_en TEXT NOT NULL,
      question_fr TEXT,
      question_ar TEXT,
      answer_en TEXT NOT NULL,
      answer_fr TEXT,
      answer_ar TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS campaign_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      photo_type TEXT NOT NULL,
      caption_en TEXT,
      caption_fr TEXT,
      caption_ar TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      name_fr TEXT,
      name_ar TEXT,
      logo_url TEXT NOT NULL,
      website_url TEXT,
      sponsor_type TEXT NOT NULL DEFAULT 'other',
      description_en TEXT,
      description_fr TEXT,
      description_ar TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS social_feed_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      post_url TEXT NOT NULL,
      embed_code TEXT,
      image_url TEXT,
      caption_en TEXT,
      caption_fr TEXT,
      caption_ar TEXT,
      author_name TEXT,
      posted_at INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS volunteer_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      campaign_id INTEGER,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      awarded_by INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  return { db, client };
}
/**
 * Create a test user in the database.
 */
export function createTestUser(
  db: ReturnType<typeof createTestDb>["db"],
  overrides: Partial<User> = {}
): User {
  const sqlite = (db as unknown as { $client: SqliteClient }).$client;
  const unionId = overrides.unionId ?? `test_user_${Date.now()}`;
  const result = sqlite
    .prepare(
      `INSERT INTO users (unionId, name, email, avatar, role, is_active, two_factor_secret, two_factor_enabled, two_factor_backup_codes, createdAt, updatedAt, lastSignInAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch(), unixepoch())`
    )
    .run(
      unionId,
      overrides.name ?? "Test User",
      overrides.email ?? "test@example.com",
      overrides.avatar ?? null,
      overrides.role ?? "user",
      (overrides.isActive ?? true) ? 1 : 0,
      overrides.twoFactorSecret ?? null,
      (overrides.twoFactorEnabled ?? false) ? 1 : 0,
      overrides.twoFactorBackupCodes ?? null
    );
  return {
    id: result.lastInsertRowid as number,
    unionId,
    name: overrides.name ?? "Test User",
    email: overrides.email ?? "test@example.com",
    avatar: overrides.avatar ?? null,
    role: (overrides.role ?? "user") as "user" | "admin",
    isActive: overrides.isActive ?? true,
    twoFactorSecret: overrides.twoFactorSecret ?? null,
    twoFactorEnabled: overrides.twoFactorEnabled ?? false,
    twoFactorBackupCodes: overrides.twoFactorBackupCodes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  };
}
/**
 * Create a mock tRPC context for testing.
 */
export function createTestContext(
  user?: User,
  reqInit?: RequestInit
): TrpcContext {
  return {
    req: new Request("http://localhost:3000", reqInit),
    resHeaders: new Headers(),
    user,
  };
}
/**
 * Seed basic test data.
 */
export function seedTestData(db: ReturnType<typeof createTestDb>["db"]) {
  const sqlite = (db as unknown as { $client: SqliteClient }).$client;
  // Insert default section visibility
  const sections = [
    { sectionKey: "hero", isVisible: 1 },
    { sectionKey: "impact", isVisible: 1 },
    { sectionKey: "about", isVisible: 1 },
    { sectionKey: "neighborhoods", isVisible: 1 },
    { sectionKey: "testimonials", isVisible: 1 },
    { sectionKey: "gallery", isVisible: 1 },
    { sectionKey: "socialFeed", isVisible: 1 },
    { sectionKey: "sponsors", isVisible: 1 },
    { sectionKey: "howToJoin", isVisible: 1 },
    { sectionKey: "faq", isVisible: 1 },
    { sectionKey: "campaigns", isVisible: 1 },
    { sectionKey: "contact", isVisible: 1 },
    { sectionKey: "donation", isVisible: 0 },
    { sectionKey: "airQuality", isVisible: 1 },
    { sectionKey: "poll", isVisible: 1 },
    { sectionKey: "leaderboard", isVisible: 1 },
  ];
  for (const section of sections) {
    sqlite
      .prepare(
        `INSERT INTO section_visibility (section_key, is_visible) VALUES (?, ?)`
      )
      .run(section.sectionKey, section.isVisible);
  }
  // Insert default site settings
  const settings = [
    { key: "stat_waste_kg", value: "2400" },
    { key: "stat_trees", value: "120" },
    { key: "contact_email", value: "contact@greenmeknes.ma" },
    { key: "points_registration", value: "1" },
    { key: "points_attendance", value: "5" },
    { key: "points_per_waste_kg", value: "0" },
    { key: "leaderboard_show_admins", value: "true" },
  ];
  for (const setting of settings) {
    sqlite
      .prepare(`INSERT INTO site_settings (key, value) VALUES (?, ?)`)
      .run(setting.key, setting.value);
  }
}
