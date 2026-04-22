import { Link, useLocation } from "wouter";
import { Briefcase, Heart, LayoutDashboard, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Briefcase, label: "Swipe" },
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/applications", icon: Send, label: "Sent" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Stats" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex justify-center min-h-[100dvh] bg-muted/30">
      <div className="w-full max-w-md bg-background flex flex-col relative shadow-2xl overflow-hidden ring-1 ring-border/50">
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        
        <nav className="absolute bottom-0 w-full bg-background/80 backdrop-blur-xl border-t border-border z-50">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative no-default-active-elevate",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full" />
                  )}
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
