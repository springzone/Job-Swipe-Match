import { Link, useLocation } from "wouter";
import {
  Briefcase,
  Heart,
  LayoutDashboard,
  Send,
  User,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex justify-center min-h-[100dvh] bg-muted/30">
      <div className="w-full sm:max-w-md bg-background flex flex-col relative shadow-2xl sm:my-4 sm:rounded-3xl overflow-hidden ring-1 ring-border/50 min-h-[100dvh] sm:min-h-0 sm:h-[calc(100dvh-2rem)]">
        <header className="flex items-center justify-between h-12 px-4 border-b border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-primary-foreground fill-current" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              {isEmployer ? "SwipeJob — Employer" : "SwipeJob"}
            </span>
          </div>
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
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
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
