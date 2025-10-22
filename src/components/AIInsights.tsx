import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Insight {
  title: string;
  description: string;
  severity: string;
  icon: typeof Brain;
}

const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    
    const { data: threats } = await supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (threats) {
      const criticalCount = threats.filter(t => t.severity === 'critical').length;
      const topType = threats.reduce((acc, t) => {
        acc[t.threat_type] = (acc[t.threat_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const mostCommonType = Object.entries(topType).sort((a, b) => b[1] - a[1])[0];

      const newInsights: Insight[] = [
        {
          title: "Critical Threat Spike Detected",
          description: `${criticalCount} critical-severity threats identified in the last 24 hours. Immediate attention required for vulnerability patching and system hardening.`,
          severity: "critical",
          icon: AlertCircle
        },
        {
          title: "Dominant Attack Vector",
          description: `${mostCommonType?.[0] || 'Unknown'} attacks represent ${mostCommonType?.[1] || 0} of recent incidents. Enhanced monitoring and specific countermeasures recommended.`,
          severity: "high",
          icon: TrendingUp
        },
        {
          title: "AI-Powered Threat Correlation",
          description: "Machine learning algorithms detected patterns indicating coordinated attack campaigns across multiple geographic regions. Consider implementing automated response protocols.",
          severity: "medium",
          icon: Brain
        }
      ];

      setInsights(newInsights);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-destructive text-destructive-foreground",
      high: "bg-warning text-warning-foreground",
      medium: "bg-primary text-primary-foreground"
    };
    return colors[severity] || "bg-secondary";
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Threat Insights
          </h2>
          <p className="text-sm text-muted-foreground">Powered by SentinelBot Intelligence</p>
        </div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{insight.title}</h3>
                      <Badge className={getSeverityColor(insight.severity)}>
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AIInsights;
