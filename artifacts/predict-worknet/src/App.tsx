import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Markets from "@/pages/markets";
import MarketDetail from "@/pages/market-detail";
import Leaderboard from "@/pages/leaderboard";
import Epochs from "@/pages/epochs";
import Highlights from "@/pages/highlights";
import Rewards from "@/pages/rewards";
import Docs from "@/pages/docs";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Join from "@/pages/join";
import AgentProfile from "@/pages/agent-profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/markets" component={Markets} />
        <Route path="/markets/:id" component={MarketDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/epochs" component={Epochs} />
        <Route path="/highlights" component={Highlights} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/docs" component={Docs} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/join" component={Join} />
        <Route path="/agents/:address" component={AgentProfile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
