import { boolean, int, index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).default("outros").notNull(),
  version: int("version").default(1).notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  source: varchar("source", { length: 255 }),
  assetUrl: varchar("assetUrl", { length: 1024 }),
  assetName: varchar("assetName", { length: 255 }),
  assetMimeType: varchar("assetMimeType", { length: 160 }),
  assetSize: int("assetSize"),
  createdBy: int("createdBy").notNull(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  messages: text("messages").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const siteAnalyticsEvents = mysqlTable("site_analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", ["session_start", "page_view", "heartbeat", "session_end"]).notNull(),
  platform: mysqlEnum("platform", ["web", "app"]).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  feature: varchar("feature", { length: 80 }).notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  referrer: varchar("referrer", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("site_analytics_created_at_idx").on(table.createdAt),
  sessionIdx: index("site_analytics_session_idx").on(table.sessionId),
  visitorIdx: index("site_analytics_visitor_idx").on(table.visitorId),
  platformIdx: index("site_analytics_platform_idx").on(table.platform, table.createdAt),
}));

export type SiteAnalyticsEvent = typeof siteAnalyticsEvents.$inferSelect;
export type InsertSiteAnalyticsEvent = typeof siteAnalyticsEvents.$inferInsert;
