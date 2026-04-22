import { db, companiesTable, jobsTable, candidatesTable, swipesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const companies = [
  { id: "c-prospective", name: "Prospective", logoColor: "#0F4C5C", industry: "Recruiting Tech", size: "50-200", about: "Switzerland's modern jobs platform reimagining how people and roles meet." },
  { id: "c-helvetia-labs", name: "Helvetia Labs", logoColor: "#C44536", industry: "AI / Research", size: "20-50", about: "An applied research lab in Zürich building tools for European enterprises." },
  { id: "c-alp-bank", name: "Alp Bank", logoColor: "#283D3B", industry: "Finance", size: "1000+", about: "Private bank with offices in Zürich and Geneva." },
  { id: "c-fondue-os", name: "FondueOS", logoColor: "#E07A5F", industry: "Developer Tools", size: "10-50", about: "We build the operating layer for Swiss small businesses." },
  { id: "c-matterhorn-health", name: "Matterhorn Health", logoColor: "#3D5A80", industry: "Healthcare", size: "200-500", about: "Patient experience software used in 40 Swiss clinics." },
  { id: "c-cogwheel", name: "Cogwheel", logoColor: "#7B2CBF", industry: "Robotics", size: "50-100", about: "Industrial robotics for European manufacturing." },
  { id: "c-rhone-design", name: "Rhône Design", logoColor: "#B7245C", industry: "Design Studio", size: "10-50", about: "A Geneva studio specialising in editorial and brand systems." },
  { id: "c-edelweiss-energy", name: "Edelweiss Energy", logoColor: "#2A9D8F", industry: "Cleantech", size: "100-500", about: "Hydrogen and grid optimization for the alpine region." },
  { id: "c-bivouac-games", name: "Bivouac Games", logoColor: "#F4A261", industry: "Games", size: "10-50", about: "An indie games studio in Lausanne." },
  { id: "c-ledger-swiss", name: "Ledger Swiss", logoColor: "#264653", industry: "Fintech", size: "200-500", about: "Compliance-grade infrastructure for crypto in Switzerland." },
];

type SeedJob = {
  id: string;
  companyId: string;
  title: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  responsibilities: string[];
  skills: string[];
  perks: string[];
  employerInterest: number;
};

const jobs: SeedJob[] = [
  {
    id: "j-1", companyId: "c-prospective", title: "Senior Frontend Engineer", location: "Zürich",
    remote: true, employmentType: "Full-time", salaryMin: 120000, salaryMax: 160000,
    description: "Help us build the candidate-facing experience used by tens of thousands of Swiss professionals every week. You'll own end-to-end shipping from design handoff to production.",
    responsibilities: ["Build React components with strong UX taste", "Collaborate with design weekly", "Own performance and accessibility"],
    skills: ["React", "TypeScript", "CSS", "Accessibility", "Vite"],
    perks: ["Hybrid", "Half-fare travel pass", "Learning budget"],
    employerInterest: 80,
  },
  {
    id: "j-2", companyId: "c-helvetia-labs", title: "Applied ML Engineer", location: "Zürich",
    remote: false, employmentType: "Full-time", salaryMin: 130000, salaryMax: 175000,
    description: "Design and ship LLM-powered features for European enterprises. Strong applied bias.",
    responsibilities: ["Prototype LLM features", "Evaluate models against in-house benchmarks", "Ship to production behind feature flags"],
    skills: ["Python", "PyTorch", "LLM", "TypeScript"],
    perks: ["Conference budget", "On-site lunch", "Stock options"],
    employerInterest: 70,
  },
  {
    id: "j-3", companyId: "c-alp-bank", title: "Backend Engineer (Trading Systems)", location: "Geneva",
    remote: false, employmentType: "Full-time", salaryMin: 140000, salaryMax: 180000,
    description: "Join the core systems team behind our private banking trading platform.",
    responsibilities: ["Design low-latency services", "Improve reliability of order flow", "Mentor junior engineers"],
    skills: ["Java", "Kotlin", "Postgres", "Kafka"],
    perks: ["13th month", "Pension scheme", "Subsidised meals"],
    employerInterest: 60,
  },
  {
    id: "j-4", companyId: "c-fondue-os", title: "Full-Stack Engineer", location: "Bern",
    remote: true, employmentType: "Full-time", salaryMin: 105000, salaryMax: 140000,
    description: "Build the back-office platform used by thousands of small Swiss businesses.",
    responsibilities: ["Ship full-stack features", "Talk to customers monthly", "Help shape the roadmap"],
    skills: ["TypeScript", "React", "Node.js", "Postgres"],
    perks: ["4-day week pilot", "Remote-first", "Equity"],
    employerInterest: 85,
  },
  {
    id: "j-5", companyId: "c-matterhorn-health", title: "Product Designer", location: "Zürich",
    remote: true, employmentType: "Full-time", salaryMin: 110000, salaryMax: 145000,
    description: "Shape the patient-facing experience used in 40+ Swiss clinics.",
    responsibilities: ["Lead design for new modules", "Run usability sessions", "Maintain the design system"],
    skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
    perks: ["Hybrid", "Wellness budget", "Conference budget"],
    employerInterest: 75,
  },
  {
    id: "j-6", companyId: "c-cogwheel", title: "Robotics Software Engineer", location: "Lausanne",
    remote: false, employmentType: "Full-time", salaryMin: 115000, salaryMax: 150000,
    description: "Write the control software for our next-generation industrial robots.",
    responsibilities: ["Develop motion planning modules", "Integrate computer vision", "Contribute to firmware"],
    skills: ["C++", "Python", "ROS", "Computer Vision"],
    perks: ["Patent bonuses", "Relocation support", "Stock options"],
    employerInterest: 65,
  },
  {
    id: "j-7", companyId: "c-rhone-design", title: "Brand Designer", location: "Geneva",
    remote: false, employmentType: "Contract", salaryMin: 90000, salaryMax: 120000,
    description: "Lead brand work for European clients in fashion, food, and culture.",
    responsibilities: ["Develop brand identities end-to-end", "Present to clients", "Direct typographic systems"],
    skills: ["Typography", "Brand Strategy", "Figma", "InDesign"],
    perks: ["Studio in Carouge", "Travel for shoots"],
    employerInterest: 55,
  },
  {
    id: "j-8", companyId: "c-edelweiss-energy", title: "Data Engineer", location: "Zürich",
    remote: true, employmentType: "Full-time", salaryMin: 115000, salaryMax: 150000,
    description: "Build the data backbone that powers our grid optimization platform.",
    responsibilities: ["Design ELT pipelines", "Own data quality", "Partner with data scientists"],
    skills: ["Python", "SQL", "dbt", "Airflow", "Snowflake"],
    perks: ["Mission-driven", "Hybrid", "Sabbatical after 5 years"],
    employerInterest: 78,
  },
  {
    id: "j-9", companyId: "c-bivouac-games", title: "Gameplay Programmer", location: "Lausanne",
    remote: true, employmentType: "Full-time", salaryMin: 95000, salaryMax: 125000,
    description: "Help us ship our next narrative adventure game.",
    responsibilities: ["Implement gameplay systems", "Collaborate with designers", "Profile and optimise"],
    skills: ["C#", "Unity", "Gameplay Programming"],
    perks: ["Royalties", "Profit sharing", "Hybrid"],
    employerInterest: 50,
  },
  {
    id: "j-10", companyId: "c-ledger-swiss", title: "DevOps Engineer", location: "Zug",
    remote: true, employmentType: "Full-time", salaryMin: 125000, salaryMax: 160000,
    description: "Operate the compliance-grade infrastructure behind our crypto custody product.",
    responsibilities: ["Run our Kubernetes platform", "Build CI/CD", "Lead incident response"],
    skills: ["Kubernetes", "Terraform", "AWS", "Go"],
    perks: ["Crypto bonuses", "Hybrid", "Hardware budget"],
    employerInterest: 72,
  },
  {
    id: "j-11", companyId: "c-prospective", title: "Product Manager — Marketplace", location: "Zürich",
    remote: true, employmentType: "Full-time", salaryMin: 130000, salaryMax: 165000,
    description: "Own the matching experience between candidates and employers across the Prospective marketplace.",
    responsibilities: ["Define the matching roadmap", "Run weekly experiments", "Partner with design and ML"],
    skills: ["Product Management", "Experimentation", "SQL", "Marketplace"],
    perks: ["Hybrid", "Equity", "Half-fare travel pass"],
    employerInterest: 82,
  },
  {
    id: "j-12", companyId: "c-helvetia-labs", title: "Research Engineer (NLP)", location: "Zürich",
    remote: false, employmentType: "Full-time", salaryMin: 135000, salaryMax: 175000,
    description: "Push state of the art in retrieval and reasoning for European languages.",
    responsibilities: ["Run experiments", "Co-author papers", "Help productionise breakthroughs"],
    skills: ["Python", "PyTorch", "NLP", "Transformers", "LLM"],
    perks: ["Publication time", "Conference travel", "Compute budget"],
    employerInterest: 60,
  },
];

const demoCandidates = [
  { handle: "QuietFalcon214", headline: "Senior frontend engineer obsessed with motion + accessibility", location: "Zürich", years: 7, skills: ["React", "TypeScript", "CSS", "Accessibility", "Vite", "Figma"], desired: "Senior Frontend Engineer", remote: true, cv: "Built design systems at two Swiss scale-ups. Led the UI rewrite of a fintech dashboard used by 40k people." },
  { handle: "BoldOtter427", headline: "Full-stack engineer, ex-FondueOS founding eng", location: "Bern", years: 5, skills: ["TypeScript", "React", "Node.js", "Postgres", "AWS"], desired: "Full-Stack Engineer", remote: true, cv: "5 years shipping product end-to-end. Comfortable across stack and on-call rotations." },
  { handle: "BraveLynx611", headline: "ML engineer focused on retrieval and agents", location: "Zürich", years: 4, skills: ["Python", "PyTorch", "LLM", "Transformers", "NLP"], desired: "Applied ML Engineer", remote: false, cv: "MSc EPFL, then 4 years building applied LLM systems for European enterprises." },
  { handle: "WittyHeron802", headline: "Data engineer, dbt enthusiast, mountain biker", location: "Zürich", years: 6, skills: ["Python", "SQL", "dbt", "Airflow", "Snowflake"], desired: "Data Engineer", remote: true, cv: "Built ELT platforms for energy and healthcare orgs. Care deeply about data contracts and observability." },
  { handle: "NobleBison139", headline: "Designer-engineer hybrid", location: "Geneva", years: 8, skills: ["Figma", "React", "TypeScript", "Design Systems", "Prototyping"], desired: "Product Designer", remote: true, cv: "8 years across Geneva agencies and product teams. Brought design + code closer at Rhône Studio." },
  { handle: "SilverWolf498", headline: "Backend engineer, low-latency JVM systems", location: "Geneva", years: 9, skills: ["Java", "Kotlin", "Postgres", "Kafka"], desired: "Backend Engineer", remote: false, cv: "Built order-flow systems at two private banks. Care about correctness under load." },
];

async function main() {
  await db.execute(sql`TRUNCATE TABLE applications, matches, swipes, jobs, companies, candidates CASCADE`);
  await db.insert(companiesTable).values(companies);
  await db.insert(jobsTable).values(
    jobs.map((j) => ({
      ...j,
      salaryCurrency: "CHF",
      postedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 14),
    })),
  );

  // Seed a few demo candidates and pending right-swipes so the employer view has something to do
  const candidateRows = demoCandidates.map((d, i) => ({
    id: `demo-c-${i + 1}`,
    anonymousHandle: d.handle,
    fullName: null,
    email: null,
    headline: d.headline,
    location: d.location,
    yearsExperience: d.years,
    skills: d.skills,
    cvText: d.cv,
    desiredRole: d.desired,
    openToRemote: d.remote,
  }));
  await db.insert(candidatesTable).values(candidateRows);

  // Map each demo candidate to one or two jobs whose skills overlap, create pending swipes
  const swipeRows: Array<{
    id: string; candidateId: string; jobId: string; direction: string; employerDecision: string;
  }> = [];
  for (const c of candidateRows) {
    const matchingJobs = jobs
      .map((j) => ({
        j,
        overlap: j.skills.filter((s) => c.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase())).length,
      }))
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 2);
    for (const { j } of matchingJobs) {
      swipeRows.push({
        id: `demo-s-${c.id}-${j.id}`,
        candidateId: c.id,
        jobId: j.id,
        direction: "right",
        employerDecision: "pending",
      });
    }
  }
  if (swipeRows.length > 0) {
    await db.insert(swipesTable).values(swipeRows);
  }

  console.log(`Seeded ${companies.length} companies, ${jobs.length} jobs, ${candidateRows.length} demo candidates, ${swipeRows.length} pending swipes.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
