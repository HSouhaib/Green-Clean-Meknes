import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";
import type { CampaignStatus } from "@contracts/constants";

// ===== USER ROLES =====
export const userRoles = sqliteTable("user_roles", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  labelEn: text("label_en").notNull(),
  labelFr: text("label_fr"),
  labelAr: text("label_ar"),
  permissions: text("permissions").notNull(),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

// ===== SITE SETTINGS =====
export const siteSettings = sqliteTable("site_settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// ===== SECTION VISIBILITY =====
export const sectionVisibility = sqliteTable("section_visibility", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sectionKey: text("section_key").notNull().unique(),
  isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SectionVisibility = typeof sectionVisibility.$inferSelect;
export type InsertSectionVisibility = typeof sectionVisibility.$inferInsert;

// ===== SECTION ORDER =====
export const sectionOrder = sqliteTable("section_order", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sectionKey: text("section_key").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SectionOrder = typeof sectionOrder.$inferSelect;
export type InsertSectionOrder = typeof sectionOrder.$inferInsert;

// ===== USERS (from auth) =====
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role").notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== CAMPAIGNS =====
export const campaigns = sqliteTable("campaigns", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr"),
  titleAr: text("title_ar"),
  locationEn: text("location_en").notNull(),
  locationFr: text("location_fr"),
  locationAr: text("location_ar"),
  descriptionEn: text("description_en").notNull(),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  date: text("date").notNull(),
  eventDate: integer("event_date", { mode: "timestamp" }),
  slug: text("slug").notNull().unique(),
  image: text("image"),
  filterTags: text("filter_tags").notNull().default("all"),
  mapX: real("map_x"),
  mapY: real("map_y"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("upcoming").$type<CampaignStatus>().$defaultFn(() => "upcoming"),
  statsWasteKg: integer("stats_waste_kg").default(0),
  statsTrees: integer("stats_trees").default(0),
  statsVolunteers: integer("stats_volunteers").default(0),
  statsNeighborhoods: integer("stats_neighborhoods").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ===== NEIGHBORHOODS =====
export const neighborhoods = sqliteTable("neighborhoods", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  nameEn: text("name_en").notNull(),
  nameFr: text("name_fr"),
  nameAr: text("name_ar"),
  slug: text("slug").notNull().unique(),
  descriptionEn: text("description_en").notNull(),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  image: text("image"),
  statsWasteKg: integer("stats_waste_kg").default(0),
  statsTrees: integer("stats_trees").default(0),
  statsVolunteers: integer("stats_volunteers").default(0),
  statsCampaigns: integer("stats_campaigns").default(0),
  mapX: real("map_x"),
  mapY: real("map_y"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = typeof neighborhoods.$inferInsert;

// ===== FAQS =====
export const faqs = sqliteTable("faqs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  questionEn: text("question_en").notNull(),
  questionFr: text("question_fr"),
  questionAr: text("question_ar"),
  answerEn: text("answer_en").notNull(),
  answerFr: text("answer_fr"),
  answerAr: text("answer_ar"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

// ===== CONTACTS =====
export const contacts = sqliteTable("contacts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  isReplied: integer("is_replied", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ===== CAMPAIGN REGISTRATIONS =====
export const campaignRegistrations = sqliteTable("campaign_registrations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id"), // Nullable — null for guest registrations
  guestName: text("guest_name"), // For guest registrations (no user account)
  guestEmail: text("guest_email"), // For guest registrations
  status: text("status").notNull().default("registered"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CampaignRegistration = typeof campaignRegistrations.$inferSelect;
export type InsertCampaignRegistration = typeof campaignRegistrations.$inferInsert;

// ===== VOLUNTEER REGISTRATIONS (self-registration form, no OAuth required) =====
export const volunteerRegistrations = sqliteTable("volunteer_registrations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type VolunteerRegistration = typeof volunteerRegistrations.$inferSelect;
export type InsertVolunteerRegistration = typeof volunteerRegistrations.$inferInsert;

// ===== TESTIMONIALS =====
export const testimonials = sqliteTable("testimonials", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  nameFr: text("name_fr"),
  role: text("role").notNull(),
  roleAr: text("role_ar"),
  roleFr: text("role_fr"),
  quoteEn: text("quote_en").notNull(),
  quoteAr: text("quote_ar"),
  quoteFr: text("quote_fr"),
  avatar: text("avatar"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

// ===== POLLS =====
export const polls = sqliteTable("polls", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  questionAr: text("question_ar"),
  questionFr: text("question_fr"),
  options: text("options").notNull(), // JSON string
  optionsAr: text("options_ar"),
  optionsFr: text("options_fr"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

// ===== POLL VOTES =====
export const pollVotes = sqliteTable("poll_votes", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  pollId: integer("poll_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;

// ===== PLANS =====
export const plans = sqliteTable("plans", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "planned", "in_progress", "completed", "cancelled"] }).notNull().default("backlog"),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  category: text("category"),
  createdBy: integer("created_by").notNull(),
  assignedTo: integer("assigned_to"),
  targetDate: integer("target_date", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ===== PLAN COMMENTS =====
export const planComments = sqliteTable("plan_comments", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  planId: integer("plan_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type PlanComment = typeof planComments.$inferSelect;
export type InsertPlanComment = typeof planComments.$inferInsert;

// ===== ACTIVITY LOGS =====
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// ===== CAMPAIGN PHOTOS (Before/After Gallery) =====
export const campaignPhotos = sqliteTable("campaign_photos", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  imageUrl: text("image_url").notNull(),
  photoType: text("photo_type", { enum: ["before", "after"] }).notNull(),
  captionEn: text("caption_en"),
  captionFr: text("caption_fr"),
  captionAr: text("caption_ar"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type CampaignPhoto = typeof campaignPhotos.$inferSelect;
export type InsertCampaignPhoto = typeof campaignPhotos.$inferInsert;

// ===== SPONSORS / PARTNERS =====
export const sponsors = sqliteTable("sponsors", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  nameFr: text("name_fr"),
  nameAr: text("name_ar"),
  logoUrl: text("logo_url").notNull(),
  websiteUrl: text("website_url"),
  sponsorType: text("sponsor_type", { enum: ["municipality", "ngo", "business", "media", "other"] }).notNull().default("other"),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;

// ===== SOCIAL FEED POSTS =====
export const socialFeedPosts = sqliteTable("social_feed_posts", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  platform: text("platform", { enum: ["instagram", "tiktok", "facebook", "twitter"] }).notNull(),
  postUrl: text("post_url").notNull(),
  embedCode: text("embed_code"),
  imageUrl: text("image_url"),
  captionEn: text("caption_en"),
  captionFr: text("caption_fr"),
  captionAr: text("caption_ar"),
  authorName: text("author_name"),
  postedAt: integer("posted_at", { mode: "timestamp" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type SocialFeedPost = typeof socialFeedPosts.$inferSelect;
export type InsertSocialFeedPost = typeof socialFeedPosts.$inferInsert;
