import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";

export const jobsTable = pgTable("jobs", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companiesTable.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  remote: boolean("remote").notNull().default(false),
  employmentType: text("employment_type").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  description: text("description").notNull(),
  responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default([]),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  perks: jsonb("perks").$type<string[]>().notNull().default([]),
  screeningQuestions: jsonb("screening_questions").$type<string[]>().notNull().default([]),
  // 0-100, controls likelihood of mutual match (simulated employer interest)
  employerInterest: integer("employer_interest").notNull().default(70),
  postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Job = typeof jobsTable.$inferSelect;
