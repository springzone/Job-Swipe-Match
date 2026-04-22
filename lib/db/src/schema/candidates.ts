import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const candidatesTable = pgTable("candidates", {
  id: text("id").primaryKey(),
  anonymousHandle: text("anonymous_handle").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  headline: text("headline"),
  location: text("location"),
  yearsExperience: integer("years_experience"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  cvText: text("cv_text"),
  desiredRole: text("desired_role"),
  openToRemote: boolean("open_to_remote"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Candidate = typeof candidatesTable.$inferSelect;
