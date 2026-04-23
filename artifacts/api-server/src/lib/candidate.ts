import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { db, candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const COOKIE = "swipejob_cid";

const ADJECTIVES = ["Quiet", "Bright", "Bold", "Calm", "Swift", "Sharp", "Warm", "Keen", "Wild", "Brave"];
const NOUNS = ["Falcon", "Otter", "Pine", "Ember", "Tide", "Fjord", "Vale", "Cipher", "Compass", "Lantern"];

function generateHandle(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${a}${n}${num}`;
}

export async function getOrCreateCandidate(req: Request, res: Response) {
  let id = req.cookies?.[COOKIE] as string | undefined;
  if (id) {
    const rows = await db.select().from(candidatesTable).where(eq(candidatesTable.id, id)).limit(1);
    if (rows[0]) return rows[0];
  }
  id = randomUUID();
  const [created] = await db
    .insert(candidatesTable)
    .values({
      id,
      anonymousHandle: generateHandle(),
      skills: [],
    })
    .returning();
  res.cookie(COOKIE, id, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 1000 * 60 * 60 * 24 * 365,
  path: "/",
});
  return created;
}
