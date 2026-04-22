import { useEffect, useState } from "react";
import { useGetJobFeed, useSwipeJob, getGetJobFeedQueryKey, getListMatchesQueryKey, getGetStatsSummaryQueryKey, getGetRecentActivityQueryKey, SwipeInputDirection } from "@workspace/api-client-react";
import { motion, useAnimation, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, MapPin, Building, Briefcase, RotateCcw, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SwipePage() {
  const { data: jobs, isLoading, error } = useGetJobFeed();
  const queryClient = useQueryClient();
  
  const swipeJob = useSwipeJob({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetJobFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        
        if (data.matched) {
          toast.success("It's a Match!", {
            description: "The employer is also interested. Send them your CV!",
            action: {
              label: "View Matches",
              onClick: () => window.location.hash = "/matches", // simplistic approach for toast nav
            }
          });
        }
      }
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full p-4 items-center justify-center">
        <Skeleton className="w-full max-w-sm aspect-[3/4] rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-destructive">
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Error loading jobs</h2>
        <p className="text-sm opacity-80 mb-6">Could not fetch the job feed at this time.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: getGetJobFeedQueryKey() })}>
          Retry
        </Button>
      </div>
    );
  }

  const activeJobs = jobs?.slice(currentIndex) || [];

  if (activeJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card/50 rounded-3xl m-4 border border-border/50 shadow-sm">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Briefcase className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">You're all caught up!</h2>
        <p className="text-muted-foreground mb-8 text-balance">
          We're constantly looking for new jobs that match your profile. Check back later or update your preferences to see more.
        </p>
        <Button asChild size="lg" className="rounded-full px-8 shadow-md hover-elevate">
          <Link href="/profile">Update preferences</Link>
        </Button>
      </div>
    );
  }

  const handleSwipe = (direction: 'left' | 'right', jobId: string) => {
    setCurrentIndex(prev => prev + 1);
    swipeJob.mutate({
      jobId,
      data: { direction: direction as SwipeInputDirection }
    });
  };

  const topJob = activeJobs[0];
  const triggerRef = { current: null as null | ((dir: 'left' | 'right') => void) };

  return (
    <div className="relative h-full w-full flex flex-col items-center touch-none p-4 pt-2 gap-4">
      <div className="self-end">
        <Button 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-sm bg-background/80 backdrop-blur-sm border-border/50"
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex(prev => prev - 1);
            }
          }}
          disabled={currentIndex === 0}
          data-testid="button-undo"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-[4/5] mx-auto flex items-center justify-center z-0 perspective-1000">
        {activeJobs.slice(0, 3).reverse().map((job, idx) => (
          <JobCard 
            key={job.id} 
            job={job} 
            isTop={idx === 2}
            onSwipe={(dir) => handleSwipe(dir, job.id)}
            index={idx}
            registerTrigger={idx === 2 ? (fn) => { triggerRef.current = fn; } : undefined}
          />
        ))}
      </div>

      {topJob && (
        <div className="flex justify-center items-center gap-6 pb-2 pt-2">
          <Button 
            size="icon" 
            variant="outline" 
            className="w-14 h-14 rounded-full border-2 border-border shadow-lg bg-background text-destructive hover:bg-destructive/10 hover:border-destructive transition-transform hover:scale-105 active:scale-95"
            onClick={() => triggerRef.current?.('left')}
            data-testid="button-pass"
          >
            <X className="w-7 h-7" />
          </Button>
          
          <Button 
            size="icon" 
            className="w-16 h-16 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
            onClick={() => triggerRef.current?.('right')}
            data-testid="button-like"
          >
            <Heart className="w-8 h-8 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}

function JobCard({ 
  job, 
  isTop, 
  onSwipe, 
  index,
  registerTrigger,
}: { 
  job: any; 
  isTop: boolean; 
  onSwipe: (dir: 'left' | 'right') => void;
  index: number;
  registerTrigger?: (fn: (dir: 'left' | 'right') => void) => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Transform values based on drag position
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Color overlays for feedback
  const rightBgOverlay = useTransform(x, [0, 100], [0, 0.4]);
  const leftBgOverlay = useTransform(x, [0, -100], [0, 0.4]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('right'));
    } else if (offset < -100 || velocity < -500) {
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe('left'));
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  // Stack styling based on position (0 is bottom, 2 is top)
  const zIndex = index;
  const scale = 1 - ((2 - index) * 0.05);
  const yOffset = (2 - index) * -15;

  const triggerSwipe = (dir: 'left' | 'right') => {
    const sign = dir === 'right' ? 1 : -1;
    controls.start({ x: sign * 500, opacity: 0, transition: { duration: 0.3 } }).then(() => onSwipe(dir));
  };

  useEffect(() => {
    if (isTop && registerTrigger) registerTrigger(triggerSwipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop]);

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
      >
        {/* Dynamic color overlays */}
        <motion.div style={{ opacity: rightBgOverlay }} className="absolute inset-0 bg-primary/20 z-10 pointer-events-none" />
        <motion.div style={{ opacity: leftBgOverlay }} className="absolute inset-0 bg-destructive/20 z-10 pointer-events-none" />

        {/* Card Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col relative z-20 pointer-events-auto">
          {/* Header Area */}
          <div className="relative p-6 pb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-sm border border-border/50"
                style={{ backgroundColor: job.company.logoColor || 'hsl(var(--muted))' }}
              />
              {job.matchScore && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {job.matchScore}% Match
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-bold leading-tight mb-1 text-balance">
              {job.title}
            </h2>
            <div className="flex items-center text-muted-foreground gap-2 text-sm font-medium">
              <Building className="w-4 h-4" />
              <span>{job.company.name}</span>
            </div>
          </div>

          <div className="px-6 flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="bg-background">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location} {job.remote && "(Remote)"}
            </Badge>
            <Badge variant="outline" className="bg-background">
              <Briefcase className="w-3 h-3 mr-1" />
              {job.employmentType}
            </Badge>
            {job.salaryMin && (
              <Badge variant="outline" className="bg-background font-mono text-xs font-semibold">
                {job.salaryCurrency} {job.salaryMin.toLocaleString()}
                {job.salaryMax ? ` - ${job.salaryMax.toLocaleString()}` : '+'}
              </Badge>
            )}
          </div>

          {/* Details Scroll Area */}
          <div className="px-6 pb-24 flex-1">
            <div className="space-y-6">
              {job.description && (
                <section>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-2">About the role</h3>
                  <p className="text-sm leading-relaxed opacity-90">{job.description}</p>
                </section>
              )}

              {job.skills && job.skills.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill: string) => (
                      <span key={skill} className="px-2.5 py-1 bg-muted/50 rounded-lg text-xs font-medium text-foreground/80">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {job.company.about && (
                <section>
                  <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-2">About {job.company.name}</h3>
                  <p className="text-sm leading-relaxed opacity-90">{job.company.about}</p>
                </section>
              )}
            </div>
          </div>
        </div>
        
        {/* Gradient fade out for scrollable content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none z-30" />
      </motion.div>
    </>
  );
}
