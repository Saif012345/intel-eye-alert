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

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <ThreatStats />
          
          {/* Search */}
          <SearchBar onSearch={handleSearch} />
          
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
