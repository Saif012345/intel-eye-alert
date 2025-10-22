import { useState } from "react";
import Header from "@/components/Header";
import ThreatStats from "@/components/ThreatStats";
import ThreatMap from "@/components/ThreatMap";
import ThreatChart from "@/components/ThreatChart";
import RecentThreats from "@/components/RecentThreats";
import CVEFeed from "@/components/CVEFeed";
import SearchBar, { SearchFilters } from "@/components/SearchBar";
import ThreatTrend from "@/components/ThreatTrend";
import AIInsights from "@/components/AIInsights";

const Index = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    severity: [],
    threatType: [],
    startDate: "",
    endDate: ""
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
        </div>
      </main>
    </div>
  );
};

export default Index;
