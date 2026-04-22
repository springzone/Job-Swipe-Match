import { Router, type IRouter } from "express";
import { db, candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateMeBody } from "@workspace/api-zod";
import { getOrCreateCandidate } from "../lib/candidate";
import { serializeCandidate } from "../lib/serializers";

const router: IRouter = Router();

router.get("/me", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  res.json(serializeCandidate(c));
});

router.put("/me", async (req, res) => {
  const c = await getOrCreateCandidate(req, res);
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", issues: parsed.error.issues });
    return;
  }
  const update: Record<string, unknown> = {};
  const b = parsed.data;
  if (b.fullName !== undefined) update.fullName = b.fullName;
  if (b.email !== undefined) update.email = b.email;
  if (b.headline !== undefined) update.headline = b.headline;
  if (b.location !== undefined) update.location = b.location;
  if (b.yearsExperience !== undefined) update.yearsExperience = b.yearsExperience;
  if (b.skills !== undefined) update.skills = b.skills;
  if (b.cvText !== undefined) update.cvText = b.cvText;
  if (b.desiredRole !== undefined) update.desiredRole = b.desiredRole;
  if (b.openToRemote !== undefined) update.openToRemote = b.openToRemote;

  const [updated] = await db
    .update(candidatesTable)
    .set(update)
    .where(eq(candidatesTable.id, c.id))
    .returning();
  res.json(serializeCandidate(updated));
});

export default router;
