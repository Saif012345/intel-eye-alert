import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ThreatFeeds from "./pages/ThreatFeeds";
import Actors from "./pages/Actors";
import IOCs from "./pages/IOCs";
import AttackMap from "./pages/AttackMap";
import Alerts from "./pages/Alerts";
import AIDefense from "./pages/AIDefense";
import Settings from "./pages/Settings";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/threat-feeds" element={<ThreatFeeds />} />
              <Route path="/actors" element={<Actors />} />
              <Route path="/iocs" element={<IOCs />} />
              <Route path="/attack-map" element={<AttackMap />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/ai-defense" element={<AIDefense />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
