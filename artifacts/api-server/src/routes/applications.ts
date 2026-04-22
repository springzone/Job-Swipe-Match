import { Router, type IRouter } from "express";
import { db, applicationsTable, jobsTable, companiesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { getOrCreateCandidate } from "../lib/candidate";
import { computeMatchScore, serializeApplication } from "../lib/serializers";

const router: IRouter = Router();

router.get("/applications", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const rows = await db
    .select({ app: applicationsTable, job: jobsTable, company: companiesTable })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .innerJoin(companiesTable, eq(jobsTable.companyId, companiesTable.id))
    .where(eq(applicationsTable.candidateId, c.id))
    .orderBy(desc(applicationsTable.sentAt));

  res.json(
    rows.map((r) =>
      serializeApplication(
        r.app,
        r.job,
        r.company,
        computeMatchScore(r.job.skills ?? [], c.skills ?? []),
      ),
    ),
  );
});

export default router;
