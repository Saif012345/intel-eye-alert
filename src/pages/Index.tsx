import Header from "@/components/Header";
import ThreatStats from "@/components/ThreatStats";
import ThreatMap from "@/components/ThreatMap";
import ThreatChart from "@/components/ThreatChart";
import RecentThreats from "@/components/RecentThreats";
import CVEFeed from "@/components/CVEFeed";
import SearchBar from "@/components/SearchBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats Overview */}
          <ThreatStats />
          
          {/* Search */}
          <SearchBar />
          
          {/* World Map */}
          <ThreatMap />
          
          {/* Charts and Feeds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ThreatChart />
            <RecentThreats />
          </div>
          
          {/* CVE Feed */}
          <CVEFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
