import { useListApplications } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Building, ExternalLink, Calendar, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, { bg: string, text: string, border: string }> = {
  submitted: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  viewed: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  interview: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  rejected: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" }
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  viewed: "Viewed by Employer",
  interview: "Interview Requested",
  rejected: "Not Selected"
};

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useListApplications();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Sent Applications</h1>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6 tracking-tight">Sent Applications</h1>
      
      {applications?.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl border border-border mt-12 shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Circle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No applications yet</h2>
          <p className="text-muted-foreground text-sm text-balance">
            When you match with an employer and send your CV, your application status will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {applications?.map((app, idx) => {
              const statusStyle = statusColors[app.status] || statusColors.submitted;
              const statusLabel = statusLabels[app.status] || app.status;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm hover-elevate transition-all"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <h3 className="font-semibold leading-tight mb-1">{app.job.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>{app.job.company.name}</span>
                      </div>
                    </div>
                    <div 
                      className="w-10 h-10 rounded-lg flex-shrink-0 border border-border/50 shadow-sm"
                      style={{ backgroundColor: app.job.company.logoColor || 'hsl(var(--muted))' }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <Badge variant="outline" className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} font-medium`}>
                      {statusLabel}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(app.sentAt), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
