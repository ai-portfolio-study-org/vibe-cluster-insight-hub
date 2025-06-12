import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Recommendation from "./pages/Recommendation";
import ClusterMap from "./pages/ClusterMap";
import Network from "./pages/Network";
import GrowthScan from "./pages/GrowthScan";
import Scenario from "./pages/Scenario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<Dashboard />} /> */}
          <Route path="/" element={<GrowthScan />} />

          {/* <Route path="/recommendation" element={<Recommendation />} /> */}
          {/* <Route path="/cluster-map" element={<ClusterMap />} /> */}
          {/* <Route path="/network" element={<Network />} /> */}
          <Route path="/growth-scan" element={<GrowthScan />} />
          {/* <Route path="/scenario" element={<Scenario />} /> */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
