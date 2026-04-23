import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const companiesTable = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logoColor: text("logo_color"),
  industry: text("industry"),
  size: text("size"),
  about: text("about"),
  quickReplies: jsonb("quick_replies").$type<string[]>().notNull().default([]),
});

export type Company = typeof companiesTable.$inferSelect;
