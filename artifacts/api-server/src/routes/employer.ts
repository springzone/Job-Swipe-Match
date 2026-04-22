import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import {
  db,
  companiesTable,
  jobsTable,
  swipesTable,
  matchesTable,
  candidatesTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { serializeCompany, serializeJob, computeMatchScore } from "../lib/serializers";

const router: IRouter = Router();

router.get("/employer/companies", async (_req, res) => {
  const rows = await db.select().from(companiesTable).orderBy(companiesTable.name);
  res.json(rows.map(serializeCompany));
});

router.get("/employer/:companyId/feed", async (req, res) => {
  const companyId = req.params.companyId;
  const company = (await db.select().from(companiesTable).where(eq(companiesTable.id, companyId)).limit(1))[0];
  if (!company) {
    res.status(404).json({ error: "company_not_found" });
    return;
  }

  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, companyId));
  if (jobs.length === 0) {
    res.json([]);
    return;
  }
  const jobIds = jobs.map((j) => j.id);
  const jobsById = new Map(jobs.map((j) => [j.id, j]));

  const swipes = await db
    .select()
    .from(swipesTable)
    .where(
      and(
        inArray(swipesTable.jobId, jobIds),
        eq(swipesTable.direction, "right"),
        eq(swipesTable.employerDecision, "pending"),
      ),
    )
    .orderBy(desc(swipesTable.createdAt));

  if (swipes.length === 0) {
    res.json([]);
    return;
  }

  const candidateIds = Array.from(new Set(swipes.map((s) => s.candidateId)));
  const candidates = await db.select().from(candidatesTable).where(inArray(candidatesTable.id, candidateIds));
  const candidatesById = new Map(candidates.map((c) => [c.id, c]));

  const items = swipes
    .map((s) => {
      const job = jobsById.get(s.jobId);
      const cand = candidatesById.get(s.candidateId);
      if (!job || !cand) return null;
      const score = computeMatchScore(job.skills ?? [], cand.skills ?? []);
      return {
        swipeId: s.id,
        candidate: {
          id: cand.id,
          anonymousHandle: cand.anonymousHandle,
          headline: cand.headline,
          location: cand.location,
          yearsExperience: cand.yearsExperience,
          skills: cand.skills ?? [],
          desiredRole: cand.desiredRole,
          openToRemote: cand.openToRemote,
        },
        job: serializeJob(job, company, score),
        matchScore: score,
        swipedAt: s.createdAt.toISOString(),
      };
    })
    .filter(Boolean);

  res.json(items);
});

router.post("/employer/:companyId/swipes/:swipeId", async (req, res) => {
  const { companyId, swipeId } = req.params;
  const decision = req.body?.decision;
  if (decision !== "accept" && decision !== "pass") {
    res.status(400).json({ error: "invalid_decision" });
    return;
  }

  const swipe = (await db.select().from(swipesTable).where(eq(swipesTable.id, swipeId)).limit(1))[0];
  if (!swipe) {
    res.status(404).json({ error: "swipe_not_found" });
    return;
  }
  const job = (await db.select().from(jobsTable).where(eq(jobsTable.id, swipe.jobId)).limit(1))[0];
  if (!job || job.companyId !== companyId) {
    res.status(403).json({ error: "wrong_company" });
    return;
  }

  if (decision === "pass") {
    await db
      .update(swipesTable)
      .set({ employerDecision: "passed" })
      .where(eq(swipesTable.id, swipeId));
    res.json({ matched: false, matchId: null });
    return;
  }

  await db
    .update(swipesTable)
    .set({ employerDecision: "accepted" })
    .where(eq(swipesTable.id, swipeId));

  const existing = (
    await db
      .select()
      .from(matchesTable)
      .where(and(eq(matchesTable.candidateId, swipe.candidateId), eq(matchesTable.jobId, swipe.jobId)))
      .limit(1)
  )[0];
  let matchId = existing?.id;
  if (!existing) {
    const [m] = await db
      .insert(matchesTable)
      .values({
        id: randomUUID(),
        candidateId: swipe.candidateId,
        jobId: swipe.jobId,
        status: "pending_confirmation",
      })
      .returning();
    matchId = m.id;
  }

  res.json({ matched: true, matchId });
});

router.get("/employer/:companyId/matches", async (req, res) => {
  const companyId = req.params.companyId;
  const company = (await db.select().from(companiesTable).where(eq(companiesTable.id, companyId)).limit(1))[0];
  if (!company) {
    res.status(404).json({ error: "company_not_found" });
    return;
  }
  const jobs = await db.select().from(jobsTable).where(eq(jobsTable.companyId, companyId));
  if (jobs.length === 0) {
    res.json([]);
    return;
  }
  const jobIds = jobs.map((j) => j.id);
  const jobsById = new Map(jobs.map((j) => [j.id, j]));

  const matches = await db
    .select()
    .from(matchesTable)
    .where(inArray(matchesTable.jobId, jobIds))
    .orderBy(desc(matchesTable.createdAt));

  if (matches.length === 0) {
    res.json([]);
    return;
  }

  const candidateIds = Array.from(new Set(matches.map((m) => m.candidateId)));
  const cands = await db.select().from(candidatesTable).where(inArray(candidatesTable.id, candidateIds));
  const candById = new Map(cands.map((c) => [c.id, c]));

  const out = matches
    .map((m) => {
      const job = jobsById.get(m.jobId);
      const cand = candById.get(m.candidateId);
      if (!job || !cand) return null;
      const cvShared = m.status === "cv_sent";
      const score = computeMatchScore(job.skills ?? [], cand.skills ?? []);
      return {
        id: m.id,
        anonymousHandle: cand.anonymousHandle,
        candidateName: cvShared ? cand.fullName : null,
        candidateEmail: cvShared ? cand.email : null,
        cvText: cvShared ? cand.cvText : null,
        candidateSkills: cand.skills ?? [],
        job: serializeJob(job, company, score),
        status: m.status as "pending_confirmation" | "cv_sent" | "dismissed",
        cvShared,
        createdAt: m.createdAt.toISOString(),
      };
    })
    .filter(Boolean);

  res.json(out);
});

export default router;
