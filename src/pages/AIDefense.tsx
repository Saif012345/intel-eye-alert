import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Activity, Zap, TrendingUp, MessageSquare } from "lucide-react";
import DefenseMetrics from "@/components/ai-defense/DefenseMetrics";
import AnomalyDetection from "@/components/ai-defense/AnomalyDetection";
import AutomatedResponseRules from "@/components/ai-defense/AutomatedResponseRules";
import AIThreatAnalysis from "@/components/ai-defense/AIThreatAnalysis";
import SentinelBotEmbed from "@/components/ai-defense/SentinelBotEmbed";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";

const AIDefense = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Defense Center
          </h1>
          <p className="text-muted-foreground">
            ML-powered threat detection, automated response, and conversational threat analysis
          </p>
        </div>

        {/* Key Metrics */}
        <DefenseMetrics />

        {/* Main Content Tabs */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">SentinelBot</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="anomaly" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Anomaly</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Predictive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentinelBotEmbed />
              <AIThreatAnalysis />
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <AIThreatAnalysis />
          </TabsContent>

          <TabsContent value="anomaly" className="space-y-4">
            <AnomalyDetection />
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <AutomatedResponseRules />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <PredictiveAnalytics />
          </TabsContent>
        </Tabs>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AutomatedResponseRules />
          <AnomalyDetection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIDefense;
