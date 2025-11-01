import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ThreatStats from "@/components/ThreatStats";
import ThreatMap from "@/components/ThreatMap";
import ThreatChart from "@/components/ThreatChart";
import RecentThreats from "@/components/RecentThreats";
import CVEFeed from "@/components/CVEFeed";
import SearchBar, { SearchFilters } from "@/components/SearchBar";
import ThreatTrend from "@/components/ThreatTrend";
import AIInsights from "@/components/AIInsights";
import ThreatTimeline from "@/components/ThreatTimeline";
import NetworkGraph from "@/components/NetworkGraph";
import SentinelBot from "@/components/SentinelBot";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";
import ThreatComparison from "@/components/ThreatComparison";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    severity: [],
    threatType: [],
    startDate: "",
    endDate: "",
    source: [],
    country: []
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleSyncThreats = async () => {
    setIsSyncing(true);
    toast.info("Syncing threat intelligence from NVD and AlienVault OTX...");
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-threat-intelligence');
      
      if (error) throw error;
      
      toast.success(data.message || `Successfully synced ${data.threatsAdded} threats`);
      
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error('Error syncing threats:', error);
      toast.error("Failed to sync threats. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <ThreatStats />
          
          {/* Search and Sync */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} />
            </div>
            <Button 
              onClick={handleSyncThreats}
              disabled={isSyncing}
              className="whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Threats'}
            </Button>
          </div>
          
          {/* World Map */}
          <ThreatMap />
          
          {/* AI Insights and Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights />
            <ThreatTrend />
          </div>
          
          {/* Charts and Feeds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ThreatChart filters={filters} />
            <RecentThreats filters={filters} />
          </div>
          
          {/* CVE Feed */}
          <CVEFeed filters={filters} />
          
          {/* Predictive Analytics */}
          <PredictiveAnalytics />
          
          {/* Threat Comparison */}
          <ThreatComparison />
          
          {/* Advanced Visualizations */}
          <ThreatTimeline />
          
          <NetworkGraph />
        </div>
        
        {/* SentinelBot AI Chatbot */}
        <SentinelBot />
      </main>
    </div>
  );
};

export default Index;
