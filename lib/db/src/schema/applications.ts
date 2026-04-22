import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";
import { matchesTable } from "./matches";

export const applicationsTable = pgTable("applications", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  matchId: text("match_id").references(() => matchesTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("submitted"), // submitted | viewed | interview | rejected
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applicationsTable.$inferSelect;
