import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { candidatesTable } from "./candidates";
import { jobsTable } from "./jobs";

export const swipesTable = pgTable(
  "swipes",
  {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id").notNull().references(() => candidatesTable.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(), // 'left' | 'right'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqCandidateJob: uniqueIndex("swipes_candidate_job_uniq").on(t.candidateId, t.jobId),
  }),
);

export type Swipe = typeof swipesTable.$inferSelect;
