import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCards } from "@/components/dashboard/StatCards";
import { AttackMapWidget } from "@/components/dashboard/AttackMapWidget";
import { RecentAlertsTable } from "@/components/dashboard/RecentAlertsTable";
import { ThreatTrendChart } from "@/components/dashboard/ThreatTrendChart";
import { ThreatTypeChart } from "@/components/dashboard/ThreatTypeChart";
import { LatestIntelFeed } from "@/components/dashboard/LatestIntelFeed";
import { AbuseIPDBWidget } from "@/components/dashboard/AbuseIPDBWidget";
import SentinelBot from "@/components/SentinelBot";
import RealTimeAlerts from "@/components/RealTimeAlerts";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <RealTimeAlerts />
      
      <div className="space-y-6">
        {/* Stat Cards */}
        <StatCards />
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attack Map - spans 2 columns */}
          <AttackMapWidget />
          
          {/* Latest Intel Feed */}
          <LatestIntelFeed />
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThreatTrendChart />
          <ThreatTypeChart />
        </div>
        
        {/* Alerts and AbuseIPDB */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentAlertsTable />
          <AbuseIPDBWidget />
        </div>
      </div>
      
      {/* SentinelBot AI Chatbot */}
      <SentinelBot />
    </DashboardLayout>
  );
};

export default Index;
