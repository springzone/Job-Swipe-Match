import { Link, useLocation } from "wouter";
import {
  Briefcase,
  Heart,
  LayoutDashboard,
  Send,
  User,
  Building2,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useListMatches } from "@workspace/api-client-react";

const BASE_TITLE = "SwipeJob TEST";

const candidateNav = [
  { href: "/", icon: Briefcase, label: "Swipe" },
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/applications", icon: Send, label: "Sent" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Stats" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isEmployer = location.startsWith("/employer");
  const { theme, toggle } = useTheme();
  const { data: matchData } = useListMatches({
    query: { enabled: !isEmployer, refetchInterval: 8000 },
  });
  const totalUnread = (matchData ?? []).reduce((sum, m) => sum + (m.unreadCount ?? 0), 0);
  const unreadByPath: Record<string, number> = { "/matches": totalUnread };

  const prevUnreadRef = useRef<Map<string, number> | null>(null);
  useEffect(() => {
    if (!matchData) return;
    const current = new Map(matchData.map((m) => [m.id, m.unreadCount ?? 0]));
    const prev = prevUnreadRef.current;
    if (prev) {
      for (const m of matchData) {
        const before = prev.get(m.id) ?? 0;
        const now = m.unreadCount ?? 0;
        if (now > before && location !== "/matches") {
          toast(`New message from ${m.job.company.name}`, {
            description: `About: ${m.job.title}`,
          });
        }
      }
    }
    prevUnreadRef.current = current;
  }, [matchData, location]);

  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [totalUnread]);

  return (
    <div className="flex justify-center min-h-[100dvh] bg-muted/30">
      <div className="w-full sm:max-w-md bg-background flex flex-col relative shadow-2xl sm:my-4 sm:rounded-3xl overflow-hidden ring-1 ring-border/50 min-h-[100dvh] sm:min-h-0 sm:h-[calc(100dvh-2rem)]">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              {isEmployer ? "SwipeJob TEST 🚀" : "SwipeJob"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="w-7 h-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover-elevate"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isEmployer ? (
              <Link
                href="/"
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                data-testid="link-back-candidate"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Candidate
              </Link>
            ) : (
              <Link
                href="/employer"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-muted hover-elevate text-foreground"
                data-testid="link-employer"
              >
                <Building2 className="w-3.5 h-3.5" /> Employer mode
              </Link>
            )}
          </div>
        </header>

        <main className={cn("flex-1 overflow-y-auto", !isEmployer && "pb-16")}>
          {children}
        </main>

        {!isEmployer && (
          <nav className="absolute bottom-0 w-full bg-background/85 backdrop-blur-xl border-t border-border z-50">
            <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)]">
              {candidateNav.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                const unread = unreadByPath[item.href] ?? 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative no-default-active-elevate",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
                    )}
                    <div className="relative">
                      <Icon
                        className="w-5 h-5"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {unread > 0 && (
                        <span
                          className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background"
                          data-testid={`nav-badge-${item.href.replace("/", "") || "home"}`}
                        >
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium tracking-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
