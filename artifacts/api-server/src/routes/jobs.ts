import { Router, type IRouter } from "express";
import { db, jobsTable, companiesTable, swipesTable } from "@workspace/db";
import { and, eq, notInArray, desc } from "drizzle-orm";
import { GetJobFeedQueryParams, GetJobParams } from "@workspace/api-zod";
import { getOrCreateCandidate } from "../lib/candidate";
import { computeMatchScore, serializeJob } from "../lib/serializers";

const router: IRouter = Router();

router.get("/jobs/feed", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const parsed = GetJobFeedQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_query" });
    return;
  }
  const { location, remote } = parsed.data;

  const swiped = await db
    .select({ jobId: swipesTable.jobId })
    .from(swipesTable)
    .where(eq(swipesTable.candidateId, c.id));
  const swipedIds = swiped.map((s) => s.jobId);

  const where = [];
  if (swipedIds.length) where.push(notInArray(jobsTable.id, swipedIds));
  if (location) where.push(eq(jobsTable.location, location));
  if (remote !== undefined) where.push(eq(jobsTable.remote, remote));

  const rows = await db
    .select({ job: jobsTable, company: companiesTable })
    .from(jobsTable)
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(jobsTable.postedAt))
    .limit(50);

  res.json(
    rows.map((r) => serializeJob(r.job, r.company, computeMatchScore(r.job.skills ?? [], c.skills ?? []))),
  );
});

router.get("/jobs/:jobId", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const parsed = GetJobParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_params" });
    return;
  }
  const [row] = await db
    .select({ job: jobsTable, company: companiesTable })
    .from(jobsTable)
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(eq(jobsTable.id, parsed.data.jobId))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(serializeJob(row.job, row.company, computeMatchScore(row.job.skills ?? [], c.skills ?? [])));
});

export default router;
