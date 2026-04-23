import { useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building,
  Check,
  Inbox,
  MapPin,
  Sparkles,
  Users,
  X,
  ChevronDown,
  Briefcase,
  Plus,
  Trash2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import {
  useListEmployerCompanies,
  useGetEmployerFeed,
  useEmployerDecide,
  useListEmployerMatches,
  useListEmployerJobs,
  useCreateEmployerJob,
  useDeleteEmployerJob,
  getGetEmployerFeedQueryKey,
  getListEmployerMatchesQueryKey,
  getListEmployerJobsQueryKey,
  getGetJobFeedQueryKey,
  type Company,
  type EmployerFeedItem,
  type EmployerMatch,
  type Job,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STORAGE_KEY = "swipejob_employer_company";

export default function EmployerPage() {
  const { data: companies, isLoading: companiesLoading } = useListEmployerCompanies();
  const [companyId, setCompanyId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (!companyId && companies && companies.length > 0) {
      const initial = companies[0].id;
      setCompanyId(initial);
      localStorage.setItem(STORAGE_KEY, initial);
    }
  }, [companies, companyId]);

  const selected = companies?.find((c) => c.id === companyId) ?? null;

  if (companiesLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CompanySwitcher
        companies={companies ?? []}
        selected={selected}
        onSelect={(c) => {
          setCompanyId(c.id);
          localStorage.setItem(STORAGE_KEY, c.id);
        }}
      />
      {selected && <EmployerWorkspace company={selected} />}
    </div>
  );
}

function CompanySwitcher({
  companies,
  selected,
  onSelect,
}: {
  companies: Company[];
  selected: Company | null;
  onSelect: (c: Company) => void;
}) {
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        Acting as employer
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover-elevate active-elevate-2 transition"
            data-testid="button-company-switcher"
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm"
              style={{ backgroundColor: selected?.logoColor ?? "#888" }}
            />
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm leading-tight">
                {selected?.name ?? "Pick a company"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {selected?.industry ?? "—"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-[60vh] overflow-y-auto">
          {companies.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onClick={() => onSelect(c)}
              className="gap-3 cursor-pointer"
              data-testid={`option-company-${c.id}`}
            >
              <div
                className="w-7 h-7 rounded-md flex-shrink-0"
                style={{ backgroundColor: c.logoColor ?? "#888" }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-tight">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.industry}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmployerWorkspace({ company }: { company: Company }) {
  const [tab, setTab] = useState<"queue" | "matches" | "jobs">("queue");
  const queryClient = useQueryClient();

  const { data: feed, isLoading: feedLoading } = useGetEmployerFeed(company.id);
  const { data: matches, isLoading: matchesLoading } = useListEmployerMatches(company.id);
  const { data: jobs, isLoading: jobsLoading } = useListEmployerJobs(company.id);

  const decide = useEmployerDecide({
    mutation: {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetEmployerFeedQueryKey(company.id) });
        queryClient.invalidateQueries({ queryKey: getListEmployerMatchesQueryKey(company.id) });
        if (res.matched) {
          toast.success("It's a match!", {
            description: "The candidate has been notified and can choose to send their CV.",
          });
        }
      },
    },
  });

  const handleDecision = (swipeId: string, decision: "accept" | "pass") => {
    decide.mutate({ companyId: company.id, swipeId, data: { decision } });
  };

  const tabBtn = (k: typeof tab, Icon: any, label: string, count?: number) => (
    <button
      onClick={() => setTab(k)}
      className={`text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
        tab === k ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
      }`}
      data-testid={`tab-${k}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label} {typeof count === "number" && count > 0 ? `(${count})` : ""}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 pt-2 pb-3">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted">
          {tabBtn("queue", Inbox, "Queue", feed?.length)}
          {tabBtn("jobs", Briefcase, "Jobs", jobs?.length)}
          {tabBtn("matches", Users, "Hires", matches?.length)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "queue" && (
          <QueueView items={feed} loading={feedLoading} onDecide={handleDecision} />
        )}
        {tab === "matches" && (
          <MatchesView matches={matches} loading={matchesLoading} companyId={companyId} />
        )}
        {tab === "jobs" && (
          <JobsView company={company} jobs={jobs} loading={jobsLoading} />
        )}
      </div>
    </div>
  );
}

function JobsView({
  company,
  jobs,
  loading,
}: {
  company: Company;
  jobs: Job[] | undefined;
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const deleteJob = useDeleteEmployerJob({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmployerJobsQueryKey(company.id) });
        queryClient.invalidateQueries({ queryKey: getGetJobFeedQueryKey() });
        toast.success("Job removed");
      },
    },
  });

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Open roles</h3>
          <p className="text-xs text-muted-foreground">
            What candidates see in their swipe deck.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full" data-testid="button-post-job">
              <Plus className="w-4 h-4 mr-1" /> Post job
            </Button>
          </DialogTrigger>
          <PostJobDialog
            company={company}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>

      {loading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))
      ) : !jobs || jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-bold mb-1">No open roles yet</h2>
          <p className="text-sm text-muted-foreground text-balance">
            Post your first job to start getting candidates in the queue.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="p-3 rounded-2xl border border-border bg-card hover-elevate flex items-start justify-between gap-3"
              data-testid={`job-${j.id}`}
            >
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-tight truncate">{j.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {j.location}
                  {j.remote && " · Remote"}
                  <span className="opacity-50">·</span>
                  {j.employmentType}
                </div>
                {j.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {j.skills.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-muted/60 rounded-md text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => {
                  if (confirm(`Remove "${j.title}"? Candidates won't see it anymore.`)) {
                    deleteJob.mutate({ companyId: company.id, jobId: j.id });
                  }
                }}
                data-testid={`button-delete-${j.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostJobDialog({ company, onClose }: { company: Company; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    location: "Zürich",
    remote: true,
    employmentType: "Full-time",
    salaryMin: "",
    salaryMax: "",
    description: "",
    skills: "",
    screeningQuestions: "",
  });

  const create = useCreateEmployerJob({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmployerJobsQueryKey(company.id) });
        queryClient.invalidateQueries({ queryKey: getGetJobFeedQueryKey() });
        toast.success("Job posted", {
          description: "Candidates will start seeing it in their swipe deck.",
        });
        onClose();
      },
      onError: () => {
        toast.error("Could not post job", { description: "Please check the required fields." });
      },
    },
  });

  const submit = () => {
    if (!form.title.trim() || !form.location.trim() || form.description.trim().length < 10) {
      toast.error("Fill in title, location, and a description (≥10 characters).");
      return;
    }
    create.mutate({
      companyId: company.id,
      data: {
        title: form.title.trim(),
        location: form.location.trim(),
        remote: form.remote,
        employmentType: form.employmentType,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        salaryCurrency: "CHF",
        description: form.description.trim(),
        responsibilities: [],
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        perks: [],
        screeningQuestions: form.screeningQuestions
          .split("\n")
          .map((q) => q.trim())
          .filter(Boolean),
      },
    });
  };

  return (
    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Post a new role</DialogTitle>
        <DialogDescription>
          Acting as <span className="font-medium text-foreground">{company.name}</span>. Candidates will
          see this in their swipe deck immediately.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="job-title">Title</Label>
          <Input
            id="job-title"
            placeholder="Senior Frontend Engineer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            data-testid="input-job-title"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              placeholder="Zürich"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              data-testid="input-job-location"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-type">Type</Label>
            <Select
              value={form.employmentType}
              onValueChange={(v) => setForm({ ...form, employmentType: v })}
            >
              <SelectTrigger id="job-type" data-testid="select-job-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
          <div>
            <div className="text-sm font-medium">Open to remote</div>
            <div className="text-xs text-muted-foreground">Show this role to remote-friendly candidates.</div>
          </div>
          <Switch
            checked={form.remote}
            onCheckedChange={(v) => setForm({ ...form, remote: v })}
            data-testid="switch-remote"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="job-salary-min">Salary min (CHF)</Label>
            <Input
              id="job-salary-min"
              type="number"
              inputMode="numeric"
              placeholder="100000"
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
              data-testid="input-salary-min"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-salary-max">Salary max (CHF)</Label>
            <Input
              id="job-salary-max"
              type="number"
              inputMode="numeric"
              placeholder="140000"
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
              data-testid="input-salary-max"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-skills">Skills (comma-separated)</Label>
          <Input
            id="job-skills"
            placeholder="React, TypeScript, Postgres"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            data-testid="input-skills"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-description">Description</Label>
          <Textarea
            id="job-description"
            rows={4}
            placeholder="What the role is about, who you're looking for, what you'll be working on…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            data-testid="input-description"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-questions">
            Pre-screen questions{" "}
            <span className="font-normal text-muted-foreground">(optional, one per line)</span>
          </Label>
          <Textarea
            id="job-questions"
            rows={3}
            placeholder={"How many years with React?\nAre you eligible to work in Switzerland?"}
            value={form.screeningQuestions}
            onChange={(e) => setForm({ ...form, screeningQuestions: e.target.value })}
            data-testid="input-screening-questions"
          />
          <p className="text-[11px] text-muted-foreground">
            Candidates answer these before their CV is sent over.
          </p>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={create.isPending} data-testid="button-submit-job">
          {create.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          Post role
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function QueueView({
  items,
  loading,
  onDecide,
}: {
  items: EmployerFeedItem[] | undefined;
  loading: boolean;
  onDecide: (swipeId: string, d: "accept" | "pass") => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items?.length]);

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="w-full aspect-[3/4] rounded-3xl" />
      </div>
    );
  }

  const stack = items?.slice(index) ?? [];
  if (stack.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
          <Inbox className="w-9 h-9 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">No candidates waiting</h2>
        <p className="text-sm text-muted-foreground text-balance">
          When a candidate swipes right on one of your roles, they'll show up here for you to review anonymously.
        </p>
      </div>
    );
  }

  const handleSwipe = (dir: "accept" | "pass", swipeId: string) => {
    setIndex((i) => i + 1);
    onDecide(swipeId, dir);
  };

  const top = stack[0];
  const triggerRef = { current: null as null | ((dir: "accept" | "pass") => void) };

  return (
    <div className="relative h-full w-full flex flex-col items-center touch-none p-4 pt-2 gap-4">
      <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-[4/5] mx-auto flex items-center justify-center perspective-1000">
        {stack.slice(0, 3).reverse().map((item, idx) => (
          <CandidateCard
            key={item.swipeId}
            item={item}
            isTop={idx === 2}
            index={idx}
            onSwipe={(dir) => handleSwipe(dir, item.swipeId)}
            registerTrigger={idx === 2 ? (fn) => { triggerRef.current = fn; } : undefined}
          />
        ))}
      </div>
      {top && (
        <div className="flex justify-center items-center gap-6 pb-4 pt-2">
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full border-2 shadow-lg bg-background text-destructive hover:bg-destructive/10"
            onClick={() => triggerRef.current?.("pass")}
            data-testid="button-pass"
          >
            <X className="w-7 h-7" />
          </Button>
          <Button
            size="icon"
            className="w-16 h-16 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => triggerRef.current?.("accept")}
            data-testid="button-accept"
          >
            <Check className="w-8 h-8" strokeWidth={3} />
          </Button>
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  item,
  isTop,
  index,
  onSwipe,
  registerTrigger,
}: {
  item: EmployerFeedItem;
  isTop: boolean;
  index: number;
  onSwipe: (dir: "accept" | "pass") => void;
  registerTrigger?: (fn: (dir: "accept" | "pass") => void) => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const acceptOverlay = useTransform(x, [0, 100], [0, 0.4]);
  const passOverlay = useTransform(x, [0, -100], [0, 0.4]);

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset > 100 || velocity > 500) {
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe("accept"));
    } else if (offset < -100 || velocity < -500) {
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe("pass"));
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const trigger = (dir: "accept" | "pass") => {
    const sign = dir === "accept" ? 1 : -1;
    controls.start({ x: sign * 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe(dir));
  };

  useEffect(() => {
    if (isTop && registerTrigger) registerTrigger(trigger);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

  const zIndex = index;
  const scale = 1 - (2 - index) * 0.05;
  const yOffset = (2 - index) * -15;

  const c = item.candidate;
  return (
    <>
      <motion.div
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, rotate, zIndex, scale, y: yOffset }}
        className="absolute inset-0 w-full h-full bg-card rounded-[2rem] shadow-xl border border-border/40 overflow-hidden flex flex-col will-change-transform"
        data-testid={`card-candidate-${c.id}`}
      >
        <motion.div style={{ opacity: acceptOverlay }} className="absolute inset-0 bg-primary/20 z-10 pointer-events-none" />
        <motion.div style={{ opacity: passOverlay }} className="absolute inset-0 bg-destructive/20 z-10 pointer-events-none" />

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-24 relative z-20">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-lg text-primary">
              {c.anonymousHandle.slice(0, 2).toUpperCase()}
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              {item.matchScore}% Fit
            </Badge>
          </div>

          <h2 className="text-2xl font-bold leading-tight mb-1">{c.anonymousHandle}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Anonymous until they share their CV
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            {c.location && (
              <Badge variant="outline" className="bg-background">
                <MapPin className="w-3 h-3 mr-1" />
                {c.location}
              </Badge>
            )}
            {typeof c.yearsExperience === "number" && (
              <Badge variant="outline" className="bg-background">
                {c.yearsExperience} yrs experience
              </Badge>
            )}
            {c.openToRemote && (
              <Badge variant="outline" className="bg-background">
                Remote ok
              </Badge>
            )}
          </div>

          {c.headline && (
            <section className="mb-5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">
                Headline
              </h3>
              <p className="text-sm leading-relaxed">{c.headline}</p>
            </section>
          )}

          {c.desiredRole && (
            <section className="mb-5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">
                Looking for
              </h3>
              <p className="text-sm">{c.desiredRole}</p>
            </section>
          )}

          {c.skills && c.skills.length > 0 && (
            <section className="mb-5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-muted/60 rounded-lg text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">
              Interested in
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm font-medium leading-tight">{item.job.title}</div>
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none z-30" />
      </motion.div>
    </>
  );
}

function MatchesView({
  matches,
  loading,
  companyId,
}: {
  matches: EmployerMatch[] | undefined;
  loading: boolean;
  companyId: string;
}) {
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);
  const chatMatch = matches?.find((m) => m.id === chatMatchId);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
          <Users className="w-9 h-9 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">No matches yet</h2>
        <p className="text-sm text-muted-foreground text-balance">
          Accept candidates from the queue to start a match. Once they confirm, you'll see their CV here.
        </p>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      {matches.map((m) => (
        <div
          key={m.id}
          className="p-4 rounded-2xl border border-border bg-card hover-elevate"
          data-testid={`match-${m.id}`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                {(m.candidateName ?? m.anonymousHandle).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm leading-tight truncate">
                  {m.candidateName ?? m.anonymousHandle}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  for {m.job.title}
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={
                m.cvShared
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100"
              }
            >
              {m.cvShared ? "CV shared" : "Awaiting CV"}
            </Badge>
          </div>

          {m.cvShared ? (
            <div className="space-y-2 mt-3">
              {m.candidateEmail && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Contact: </span>
                  <a
                    href={`mailto:${m.candidateEmail}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {m.candidateEmail}
                  </a>
                </div>
              )}
              {m.screeningAnswers && m.screeningAnswers.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Screening answers
                  </div>
                  {m.screeningAnswers.map((qa: { question: string; answer: string }, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-muted/40 border border-border/50"
                      data-testid={`screening-${m.id}-${i}`}
                    >
                      <div className="text-xs font-semibold text-foreground/80 mb-1">
                        {qa.question}
                      </div>
                      <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {qa.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {m.cvText && (
                <div className="mt-2 p-3 rounded-xl bg-muted/50 text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {m.cvText}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setChatMatchId(m.id)}
                data-testid={`button-chat-${m.id}`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {m.candidateName ?? m.anonymousHandle}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              The candidate has been notified. They'll choose to share their CV next.
            </p>
          )}
        </div>
      ))}
      {chatMatchId && (
        <ChatThread
          open={!!chatMatchId}
          onOpenChange={(o) => !o && setChatMatchId(null)}
          matchId={chatMatchId}
          side="employer"
          companyId={companyId}
          title={chatMatch ? `Chat with ${chatMatch.candidateName ?? chatMatch.anonymousHandle}` : "Chat"}
          subtitle={chatMatch ? `About: ${chatMatch.job.title}` : undefined}
        />
      )}
    </div>
  );
}
