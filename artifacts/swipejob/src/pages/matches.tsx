import { useState } from "react";
import { 
  useListMatches, 
  useGetMe, 
  useConfirmSendCv, 
  useDismissMatch, 
  getListMatchesQueryKey, 
  getListApplicationsQueryKey, 
  getGetStatsSummaryQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Building, MapPin, Briefcase, FileText, Send, X, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MatchesPage() {
  const { data: matches, isLoading } = useListMatches();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const confirmCv = useConfirmSendCv({
    mutation: {
      onSuccess: () => {
        toast.success("CV Sent Successfully", {
          description: "The employer has received your profile.",
        });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        setSelectedMatchId(null);
      },
      onError: () => {
        toast.error("Failed to send CV. Please try again.");
      }
    }
  });

  const dismiss = useDismissMatch({
    mutation: {
      onSuccess: () => {
        toast.success("Match dismissed.");
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Your Matches</h1>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const selectedMatch = matches?.find(m => m.id === selectedMatchId);

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6 tracking-tight">Your Matches</h1>
      
      {matches?.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl border border-border mt-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No matches yet</h2>
          <p className="text-muted-foreground text-sm">Keep swiping! When an employer likes your anonymous profile back, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {matches?.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className={`p-5 rounded-2xl border ${
                  match.status === 'pending_confirmation' 
                    ? 'bg-card border-primary/20 shadow-md ring-1 ring-primary/10' 
                    : match.status === 'cv_sent'
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-muted/10 border-border/30 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: match.job.company.logoColor || 'hsl(var(--muted))' }}
                    />
                    <div>
                      <h3 className="font-bold leading-tight">{match.job.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3" /> {match.job.company.name}
                      </p>
                    </div>
                  </div>
                  {idx === 0 && match.status === 'pending_confirmation' && (
                    <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/90 animate-pulse">
                      New!
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                  <span className="flex items-center text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50">
                    <MapPin className="w-3 h-3 mr-1" /> {match.job.location}
                  </span>
                  {match.job.salaryMin && (
                    <span className="flex items-center text-muted-foreground bg-background px-2 py-1 rounded-md border border-border/50 font-mono">
                      {match.job.salaryCurrency} {match.job.salaryMin.toLocaleString()}
                    </span>
                  )}
                </div>

                {match.status === 'pending_confirmation' ? (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1 shadow-sm hover-elevate" 
                      onClick={() => setSelectedMatchId(match.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send CV
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      onClick={() => dismiss.mutate({ matchId: match.id })}
                      disabled={dismiss.isPending}
                    >
                      Pass
                    </Button>
                  </div>
                ) : match.status === 'cv_sent' ? (
                  <div className="flex items-center justify-between mt-4 py-2 px-3 bg-primary/10 rounded-lg border border-primary/20 text-sm font-medium text-primary">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> CV Sent
                    </span>
                    <span className="text-xs opacity-80">{formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}</span>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <X className="w-4 h-4" /> Dismissed
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CV Confirmation Dialog */}
      <Dialog open={!!selectedMatchId} onOpenChange={(open) => !open && setSelectedMatchId(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="p-6 pb-2 border-b border-border/50 bg-muted/30">
            <DialogTitle className="text-xl">Send your CV</DialogTitle>
            <DialogDescription>
              This is what {selectedMatch?.job.company.name} will see when you confirm.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">Profile Info</h4>
                <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3 shadow-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Name</span>
                    <p className="font-medium">{me?.fullName || 'Anonymous'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Email</span>
                    <p className="font-medium">{me?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Headline</span>
                    <p className="font-medium">{me?.headline || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {me?.skills.length ? (
                    me.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-3">CV / Resume Text</h4>
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {me?.cvText || <span className="italic text-muted-foreground">No CV text provided. You might want to update your profile first.</span>}
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 pt-4 border-t border-border/50 bg-background sm:justify-between flex-row items-center gap-2">
            <Button variant="ghost" onClick={() => setSelectedMatchId(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto shadow-md"
              onClick={() => selectedMatch && confirmCv.mutate({ matchId: selectedMatch.id })}
              disabled={confirmCv.isPending}
            >
              {confirmCv.isPending ? "Sending..." : "Confirm & Send CV"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Just importing Heart for the empty state
function Heart(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
}