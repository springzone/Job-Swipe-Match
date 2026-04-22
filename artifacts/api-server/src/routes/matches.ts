import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import {
  db,
  matchesTable,
  jobsTable,
  companiesTable,
  applicationsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { ConfirmSendCvParams, DismissMatchParams } from "@workspace/api-zod";
import { getOrCreateCandidate } from "../lib/candidate";
import {
  computeMatchScore,
  serializeApplication,
  serializeMatch,
} from "../lib/serializers";

const router: IRouter = Router();

router.get("/matches", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const rows = await db
    .select({ match: matchesTable, job: jobsTable, company: companiesTable })
    .from(matchesTable)
    .innerJoin(jobsTable, eq(matchesTable.jobId, jobsTable.id))
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(eq(matchesTable.candidateId, c.id))
    .orderBy(desc(matchesTable.createdAt));

  res.json(
    rows.map((r) =>
      serializeMatch(r.match, r.job, r.company, computeMatchScore(r.job.skills ?? [], c.skills ?? [])),
    ),
  );
});

router.post("/matches/:matchId/send-cv", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const parsed = ConfirmSendCvParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_params" });
    return;
  }
  const [row] = await db
    .select({ match: matchesTable, job: jobsTable, company: companiesTable })
    .from(matchesTable)
    .innerJoin(jobsTable, eq(matchesTable.jobId, jobsTable.id))
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(and(eq(matchesTable.id, parsed.data.matchId), eq(matchesTable.candidateId, c.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "match_not_found" });
    return;
  }

  await db
    .update(matchesTable)
    .set({ status: "cv_sent" })
    .where(eq(matchesTable.id, row.match.id));

  // Avoid duplicate applications
  const existingApp = await db
    .select()
    .from(applicationsTable)
    .where(
      and(
        eq(applicationsTable.candidateId, c.id),
        eq(applicationsTable.jobId, row.job.id),
      ),
    )
    .limit(1);

  let app = existingApp[0];
  if (!app) {
    const [created] = await db
      .insert(applicationsTable)
      .values({
        id: randomUUID(),
        candidateId: c.id,
        jobId: row.job.id,
        matchId: row.match.id,
        status: "submitted",
      })
      .returning();
    app = created;
  }

  res.json(
    serializeApplication(
      app,
      row.job,
      row.company,
      computeMatchScore(row.job.skills ?? [], c.skills ?? []),
    ),
  );
});

router.post("/matches/:matchId/dismiss", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const parsed = DismissMatchParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_params" });
    return;
  }
  const [row] = await db
    .select({ match: matchesTable, job: jobsTable, company: companiesTable })
    .from(matchesTable)
    .innerJoin(jobsTable, eq(matchesTable.jobId, jobsTable.id))
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(and(eq(matchesTable.id, parsed.data.matchId), eq(matchesTable.candidateId, c.id)))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "match_not_found" });
    return;
  }
  const [updated] = await db
    .update(matchesTable)
    .set({ status: "dismissed" })
    .where(eq(matchesTable.id, row.match.id))
    .returning();
  res.json(
    serializeMatch(
      updated,
      row.job,
      row.company,
      computeMatchScore(row.job.skills ?? [], c.skills ?? []),
    ),
  );
});

export default router;
