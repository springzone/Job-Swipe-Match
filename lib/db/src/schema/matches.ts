import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";

export const matchesTable = pgTable("matches", {
  id: text("id").primaryKey(),
  candidateId: text("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
  jobId: text("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending_confirmation"), // pending_confirmation | cv_sent | dismissed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  candidateLastReadAt: timestamp("candidate_last_read_at", { withTimezone: true }).notNull().defaultNow(),
  employerLastReadAt: timestamp("employer_last_read_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Match = typeof matchesTable.$inferSelect;
