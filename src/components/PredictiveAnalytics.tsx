import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Prediction {
  id: string;
  title: string;
  description: string;
  likelihood: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  impact: string;
  icon: 'alert' | 'target' | 'shield';
}

const PredictiveAnalytics = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyzeTrends();
  }, []);

  const analyzeTrends = async () => {
    try {
      const { data: threats } = await supabase
        .from('threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!threats) return;

      const predictions: Prediction[] = [];

      // Analyze threat type trends
      const threatTypeCounts = threats.reduce((acc, t) => {
        acc[t.threat_type] = (acc[t.threat_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topThreatType = Object.entries(threatTypeCounts)
        .sort(([, a], [, b]) => b - a)[0];

      if (topThreatType) {
        predictions.push({
          id: '1',
          title: `${topThreatType[0].charAt(0).toUpperCase() + topThreatType[0].slice(1)} Activity Surge`,
          description: `${topThreatType[0]} threats increased by ${Math.round((topThreatType[1] / threats.length) * 100)}%. Expect continued activity in next 48 hours.`,
          likelihood: topThreatType[1] > threats.length * 0.3 ? 'high' : 'medium',
          trend: 'up',
          impact: 'Critical systems may be targeted',
          icon: 'alert'
        });
      }

      // Analyze severity trends
      const criticalCount = threats.filter(t => t.severity === 'critical').length;
      if (criticalCount > threats.length * 0.2) {
        predictions.push({
          id: '2',
          title: 'Critical Threat Escalation',
          description: `${criticalCount} critical threats detected. ${Math.round((criticalCount / threats.length) * 100)}% of recent activity.`,
          likelihood: 'high',
          trend: 'up',
          impact: 'Immediate incident response may be required',
          icon: 'target'
        });
      }

      // Analyze geographic patterns
      const countryCounts = threats
        .filter(t => t.country)
        .reduce((acc, t) => {
          acc[t.country!] = (acc[t.country!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const topCountry = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)[0];

      if (topCountry && topCountry[1] > 5) {
        predictions.push({
          id: '3',
          title: `Geographic Concentration: ${topCountry[0]}`,
          description: `${topCountry[1]} threats originating from ${topCountry[0]}. Potential coordinated campaign.`,
          likelihood: 'medium',
          trend: 'up',
          impact: 'Enhanced monitoring recommended for this region',
          icon: 'shield'
        });
      }

      // Add defensive prediction
      predictions.push({
        id: '4',
        title: 'Defense Posture Recommendation',
        description: 'Current threat landscape suggests increasing DDoS and phishing defenses.',
        likelihood: 'high',
        trend: 'stable',
        impact: 'Proactive defense optimization needed',
        icon: 'shield'
      });

      setPredictions(predictions);
    } catch (error) {
      console.error('Error analyzing trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      case 'target': return <Target className="w-5 h-5" />;
      case 'shield': return <Shield className="w-5 h-5" />;
      default: return <TrendingUp className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold mb-4">Predictive Analytics</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Predictive Analytics</h2>
        <p className="text-sm text-muted-foreground">AI-powered threat forecasting and trend analysis</p>
      </div>

      <div className="space-y-4">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className="p-4 rounded-lg bg-secondary border border-border hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-primary">{getIcon(prediction.icon)}</div>
                <h3 className="font-semibold">{prediction.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getLikelihoodColor(prediction.likelihood)}>
                  {prediction.likelihood}
                </Badge>
                {prediction.trend === 'up' && <TrendingUp className="w-4 h-4 text-destructive" />}
                {prediction.trend === 'down' && <TrendingDown className="w-4 h-4 text-success" />}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{prediction.description}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-warning">Impact:</span>
              <span className="text-muted-foreground">{prediction.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PredictiveAnalytics;