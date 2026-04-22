import { useGetStatsSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { 
  BarChart3, 
  CheckCircle2, 
  Activity, 
  Briefcase, 
  Swords, 
  Heart,
  Send,
  User,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  if (statsLoading || activityLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-6">Stats & Activity</h1>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const getIconForKind = (kind: string) => {
    switch (kind) {
      case 'swipe_right': return <Heart className="w-4 h-4 text-primary" />;
      case 'match': return <Swords className="w-4 h-4 text-secondary" />;
      case 'cv_sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'status_change': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const chartData = stats?.topSkillsInDemand?.slice(0, 5) || [];

  return (
    <div className="p-6 pb-24 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Stats & Activity</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm border-border/50 hover-elevate transition-all">
          <CardContent className="p-5 flex flex-col items-center text-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.rightSwipes || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Right Swipes</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50 hover-elevate transition-all">
          <CardContent className="p-5 flex flex-col items-center text-center justify-center">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
              <Swords className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.matches || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Matches</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50 hover-elevate transition-all">
          <CardContent className="p-5 flex flex-col items-center text-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.applicationsSent || 0}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">CVs Sent</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/50 hover-elevate transition-all relative overflow-hidden">
          <CardContent className="p-5 flex flex-col items-center text-center justify-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.profileCompleteness || 0}%</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Profile</div>
            
            {/* Progress bar background */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full"
            >
              <div 
                className="h-full bg-primary" 
                style={{ width: `${stats?.profileCompleteness || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              In-Demand Skills
            </CardTitle>
            <CardDescription className="text-xs">Based on jobs in your feed</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="skill" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid hsl(var(--border))',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - (index * 0.15)})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 tracking-tight">
          <Activity className="w-5 h-5 text-muted-foreground" />
          Recent Activity
        </h2>
        
        {activity?.length === 0 ? (
          <div className="text-center p-6 bg-muted/20 rounded-2xl border border-border/50">
            <p className="text-sm text-muted-foreground">No recent activity. Start swiping!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activity?.map((item, idx) => (
              <div key={item.id} className="flex gap-4 relative group">
                {/* Timeline line */}
                {idx !== activity.length - 1 && (
                  <div className="absolute left-[1.1rem] top-10 bottom-[-1rem] w-px bg-border/60 group-hover:bg-border transition-colors" />
                )}
                
                <div className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                  {getIconForKind(item.kind)}
                </div>
                
                <div className="flex-1 pb-2 pt-1">
                  <p className="text-sm font-medium leading-snug mb-1">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
