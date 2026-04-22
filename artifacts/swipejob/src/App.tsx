import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import SwipePage from "@/pages/swipe";
import MatchesPage from "@/pages/matches";
import ApplicationsPage from "@/pages/applications";
import ProfilePage from "@/pages/profile";
import DashboardPage from "@/pages/dashboard";
import EmployerPage from "@/pages/employer";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={SwipePage} />
        <Route path="/matches" component={MatchesPage} />
        <Route path="/applications" component={ApplicationsPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/employer" component={EmployerPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
