import type { Job, Company, Match, Application, Candidate } from "@workspace/db";

export function serializeCompany(c: Company) {
  return {
    id: c.id,
    name: c.name,
    logoColor: c.logoColor,
    industry: c.industry,
    size: c.size,
    about: c.about,
  };
}

export function serializeJob(j: Job, company: Company, matchScore?: number) {
  return {
    id: j.id,
    title: j.title,
    company: serializeCompany(company),
    location: j.location,
    remote: j.remote,
    employmentType: j.employmentType,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryCurrency: j.salaryCurrency,
    description: j.description,
    responsibilities: j.responsibilities ?? [],
    skills: j.skills ?? [],
    perks: j.perks ?? [],
    postedAt: j.postedAt.toISOString(),
    matchScore: matchScore ?? null,
  };
}

export function serializeCandidate(c: Candidate) {
  return {
    id: c.id,
    anonymousHandle: c.anonymousHandle,
    fullName: c.fullName,
    email: c.email,
    headline: c.headline,
    location: c.location,
    yearsExperience: c.yearsExperience,
    skills: c.skills ?? [],
    cvText: c.cvText,
    desiredRole: c.desiredRole,
    openToRemote: c.openToRemote,
    createdAt: c.createdAt.toISOString(),
  };
}

export function serializeMatch(m: Match, j: Job, company: Company, score?: number) {
  return {
    id: m.id,
    job: serializeJob(j, company, score),
    status: m.status as "pending_confirmation" | "cv_sent" | "dismissed",
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeApplication(a: Application, j: Job, company: Company, score?: number) {
  return {
    id: a.id,
    job: serializeJob(j, company, score),
    status: a.status as "submitted" | "viewed" | "interview" | "rejected",
    sentAt: a.sentAt.toISOString(),
  };
}

export function computeMatchScore(jobSkills: string[], candidateSkills: string[]): number {
  if (!jobSkills.length) return 60;
  const cs = new Set(candidateSkills.map((s) => s.toLowerCase()));
  if (cs.size === 0) return 55;
  const overlap = jobSkills.filter((s) => cs.has(s.toLowerCase())).length;
  const ratio = overlap / jobSkills.length;
  return Math.min(99, Math.max(35, Math.round(40 + ratio * 60)));
}

export function profileCompleteness(c: Candidate): number {
  const fields: Array<unknown> = [
    c.fullName,
    c.email,
    c.headline,
    c.location,
    c.yearsExperience,
    c.cvText,
    c.desiredRole,
    c.openToRemote,
    c.skills && c.skills.length > 0 ? "x" : null,
  ];
  const filled = fields.filter((v) => v !== null && v !== undefined && v !== "").length;
  return Math.round((filled / fields.length) * 100);
}
