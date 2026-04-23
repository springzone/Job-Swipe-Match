import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { db, matchesTable, messagesTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { getOrCreateCandidate } from "../lib/candidate";

const router: IRouter = Router();

function serializeMessage(m: {
  id: string;
  matchId: string;
  sender: string;
  body: string;
  createdAt: Date;
}) {
  return {
    id: m.id,
    matchId: m.matchId,
    sender: m.sender as "candidate" | "employer",
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/matches/:matchId/messages", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const match = (
    await db
      .select()
      .from(matchesTable)
      .where(and(eq(matchesTable.id, req.params.matchId), eq(matchesTable.candidateId, c.id)))
      .limit(1)
  )[0];
  if (!match) {
    res.status(404).json({ error: "match_not_found" });
    return;
  }
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.matchId, match.id))
    .orderBy(asc(messagesTable.createdAt));
  res.json(rows.map(serializeMessage));
});

router.post("/matches/:matchId/messages", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const body = (req.body?.body ?? "").toString().trim();
  if (!body) {
    res.status(400).json({ error: "empty_body" });
    return;
  }
  const match = (
    await db
      .select()
      .from(matchesTable)
      .where(and(eq(matchesTable.id, req.params.matchId), eq(matchesTable.candidateId, c.id)))
      .limit(1)
  )[0];
  if (!match) {
    res.status(404).json({ error: "match_not_found" });
    return;
  }
  if (match.status !== "cv_sent") {
    res.status(409).json({ error: "chat_locked", message: "Send your CV first to start chatting." });
    return;
  }
  const [created] = await db
    .insert(messagesTable)
    .values({
      id: randomUUID(),
      matchId: match.id,
      sender: "candidate",
      body: body.slice(0, 2000),
    })
    .returning();
  res.json(serializeMessage(created));
});

export default router;
