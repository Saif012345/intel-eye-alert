import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Activity, Zap, TrendingUp, MessageSquare, ClipboardList, Sparkles, Shield } from "lucide-react";
import DefenseMetrics from "@/components/ai-defense/DefenseMetrics";
import AnomalyDetection from "@/components/ai-defense/AnomalyDetection";
import AutomatedResponseRules from "@/components/ai-defense/AutomatedResponseRules";
import AIThreatAnalysis from "@/components/ai-defense/AIThreatAnalysis";
import SentinelBotEmbed from "@/components/ai-defense/SentinelBotEmbed";
import ThreatInvestigation from "@/components/ai-defense/ThreatInvestigation";
import PredictiveAnalytics from "@/components/PredictiveAnalytics";

const AIDefense = () => {
  const [botMessage, setBotMessage] = useState<string | undefined>();

  const handleAskBot = (message: string) => {
    setBotMessage(message);
  };

  const handleMessageProcessed = () => {
    setBotMessage(undefined);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header with Glow Effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-transparent rounded-2xl blur-xl" />
          <div className="relative glass rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-pulse" />
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <span className="gradient-text">AI Defense Center</span>
                  <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                </h1>
                <p className="text-muted-foreground mt-1">
                  ML-powered threat detection, guided investigations, and conversational threat analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics with Enhanced Styling */}
        <DefenseMetrics />

        {/* Main Content Tabs with Glow Effects */}
        <Tabs defaultValue="investigate" className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur-lg opacity-50" />
            <TabsList className="relative grid w-full grid-cols-6 lg:w-auto lg:inline-flex bg-secondary/80 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="investigate" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Investigate</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">SentinelBot</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="anomaly" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Anomaly</span>
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Automation</span>
              </TabsTrigger>
              <TabsTrigger value="predictive" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Predictive</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="investigate" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ThreatInvestigation onAskBot={handleAskBot} />
              <SentinelBotEmbed 
                externalMessage={botMessage} 
                onMessageProcessed={handleMessageProcessed}
              />
            </div>
          </TabsContent>

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

        {/* Bottom Section with Gradient Border */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-primary/20 to-warning/20 rounded-2xl blur-xl opacity-30" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AutomatedResponseRules />
            <AnomalyDetection />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIDefense;
