import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { db, swipesTable, jobsTable, companiesTable, matchesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { SwipeJobBody, SwipeJobParams } from "@workspace/api-zod";
import { getOrCreateCandidate } from "../lib/candidate";
import { computeMatchScore, serializeMatch } from "../lib/serializers";

const router: IRouter = Router();

router.post("/jobs/:jobId/swipe", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const params = SwipeJobParams.safeParse(req.params);
  const body = SwipeJobBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const [row] = await db
    .select({ job: jobsTable, company: companiesTable })
    .from(jobsTable)
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(eq(jobsTable.id, params.data.jobId))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "job_not_found" });
    return;
  }

  const swipeId = randomUUID();
  let matched = false;
  let serializedMatch: ReturnType<typeof serializeMatch> | null = null;
  const score = computeMatchScore(row.job.skills ?? [], c.skills ?? []);

  // Decide employer behaviour for right swipes:
  // - small chance of an instant auto-match (simulating an employer who already liked the candidate)
  // - otherwise the swipe goes into the employer review queue with status 'pending'
  let employerDecision: string | null = null;
  if (body.data.direction === "right") {
    const employerProb = (row.job.employerInterest ?? 70) / 100;
    const scoreBoost = score / 200;
    const acceptProb = Math.min(0.6, employerProb * 0.4 + scoreBoost * 0.3);
    if (Math.random() < acceptProb) {
      matched = true;
      employerDecision = "accepted";
    } else {
      employerDecision = "pending";
    }
  }

  try {
    await db.insert(swipesTable).values({
      id: swipeId,
      candidateId: c.id,
      jobId: params.data.jobId,
      direction: body.data.direction,
      employerDecision,
    });
  } catch {
    // already swiped — ignore
  }

  if (body.data.direction === "right") {
    if (matched) {
      const existing = await db
        .select()
        .from(matchesTable)
        .where(and(eq(matchesTable.candidateId, c.id), eq(matchesTable.jobId, params.data.jobId)))
        .limit(1);
      let match = existing[0];
      if (!match) {
        const [m] = await db
          .insert(matchesTable)
          .values({
            id: randomUUID(),
            candidateId: c.id,
            jobId: params.data.jobId,
            status: "pending_confirmation",
          })
          .returning();
        match = m;
      }
      serializedMatch = serializeMatch(match, row.job, row.company, score);
    }
  }

  res.json({
    swipeId,
    direction: body.data.direction,
    matched,
    match: serializedMatch,
  });
});

export default router;
