import { Router, type IRouter } from "express";
import {
  db,
  swipesTable,
  matchesTable,
  applicationsTable,
  jobsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { getOrCreateCandidate } from "../lib/candidate";
import { profileCompleteness } from "../lib/serializers";

const router: IRouter = Router();

router.get("/stats/summary", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);

  const swipes = await db.select().from(swipesTable).where(eq(swipesTable.candidateId, c.id));
  const matches = await db.select().from(matchesTable).where(eq(matchesTable.candidateId, c.id));
  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.candidateId, c.id));

  // Top skills in demand: aggregate skills across all jobs in feed
  const allJobs = await db.select().from(jobsTable);
  const counts: Record<string, number> = {};
  for (const j of allJobs) {
    for (const s of j.skills ?? []) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  const topSkillsInDemand = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  res.json({
    totalSwipes: swipes.length,
    rightSwipes: swipes.filter((s) => s.direction === "right").length,
    matches: matches.length,
    applicationsSent: apps.length,
    profileCompleteness: profileCompleteness(c),
    topSkillsInDemand,
  });
});

router.get("/stats/activity", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);

  type Item = {
    id: string;
    kind: "swipe_right" | "match" | "cv_sent" | "status_change";
    message: string;
    jobId: string | null;
    at: string;
  };
  const items: Item[] = [];

  const rightSwipes = await db
    .select({ swipe: swipesTable, job: jobsTable })
    .from(swipesTable)
    .innerJoin(jobsTable, eq(swipesTable.jobId, jobsTable.id))
    .where(and(eq(swipesTable.candidateId, c.id), eq(swipesTable.direction, "right")))
    .orderBy(desc(swipesTable.createdAt))
    .limit(20);
  for (const r of rightSwipes) {
    items.push({
      id: `s-${r.swipe.id}`,
      kind: "swipe_right",
      message: `You swiped right on ${r.job.title}`,
      jobId: r.job.id,
      at: r.swipe.createdAt.toISOString(),
    });
  }

  const matchRows = await db
    .select({ match: matchesTable, job: jobsTable })
    .from(matchesTable)
    .innerJoin(jobsTable, eq(matchesTable.jobId, jobsTable.id))
    .where(eq(matchesTable.candidateId, c.id))
    .orderBy(desc(matchesTable.createdAt))
    .limit(20);
  for (const m of matchRows) {
    items.push({
      id: `m-${m.match.id}`,
      kind: "match",
      message: `It's a match with ${m.job.title}`,
      jobId: m.job.id,
      at: m.match.createdAt.toISOString(),
    });
  }

  const appRows = await db
    .select({ app: applicationsTable, job: jobsTable })
    .from(applicationsTable)
    .innerJoin(jobsTable, eq(applicationsTable.jobId, jobsTable.id))
    .where(eq(applicationsTable.candidateId, c.id))
    .orderBy(desc(applicationsTable.sentAt))
    .limit(20);
  for (const a of appRows) {
    items.push({
      id: `a-${a.app.id}`,
      kind: "cv_sent",
      message: `CV sent to ${a.job.title}`,
      jobId: a.job.id,
      at: a.app.sentAt.toISOString(),
    });
  }

  items.sort((x, y) => (x.at < y.at ? 1 : -1));
  res.json(items.slice(0, 30));
});

export default router;
