import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { matchesTable } from "./matches";

export const messagesTable = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull().references(() => matchesTable.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(), // "candidate" | "employer"
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    matchIdx: index("messages_match_idx").on(t.matchId, t.createdAt),
  }),
);

export type Message = typeof messagesTable.$inferSelect;
