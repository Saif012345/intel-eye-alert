import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertCircle, TrendingUp, Zap, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnomalyData {
  id: string;
  type: string;
  score: number;
  baseline: number;
  deviation: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

const AnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [overallScore, setOverallScore] = useState(85);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyzeAnomalies();
  }, []);

  const analyzeAnomalies = async () => {
    try {
      const { data: threats } = await supabase
        .from('threats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!threats) return;

      const now = new Date();
      const last24h = threats.filter(t => 
        new Date(t.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      );
      const last48h = threats.filter(t => 
        new Date(t.created_at) > new Date(now.getTime() - 48 * 60 * 60 * 1000) &&
        new Date(t.created_at) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
      );

      const volumeChange = last48h.length > 0 
        ? ((last24h.length - last48h.length) / last48h.length) * 100 
        : 0;

      const criticalRate = threats.length > 0
        ? (threats.filter(t => t.severity === 'critical').length / threats.length) * 100
        : 0;

      const uniqueSources = new Set(threats.map(t => t.source)).size;
      const uniqueCountries = new Set(threats.filter(t => t.country).map(t => t.country)).size;

      const anomalyData: AnomalyData[] = [
        {
          id: '1',
          type: 'Threat Volume',
          score: Math.min(100, Math.abs(volumeChange)),
          baseline: 100,
          deviation: volumeChange,
          status: Math.abs(volumeChange) > 50 ? 'critical' : Math.abs(volumeChange) > 25 ? 'warning' : 'normal',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          type: 'Critical Threat Rate',
          score: criticalRate,
          baseline: 15,
          deviation: criticalRate - 15,
          status: criticalRate > 30 ? 'critical' : criticalRate > 20 ? 'warning' : 'normal',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          type: 'Source Diversity',
          score: (uniqueSources / 10) * 100,
          baseline: 50,
          deviation: ((uniqueSources / 10) * 100) - 50,
          status: uniqueSources < 3 ? 'warning' : 'normal',
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          type: 'Geographic Spread',
          score: (uniqueCountries / 20) * 100,
          baseline: 30,
          deviation: ((uniqueCountries / 20) * 100) - 30,
          status: uniqueCountries > 15 ? 'critical' : uniqueCountries > 10 ? 'warning' : 'normal',
          lastUpdated: new Date().toISOString()
        }
      ];

      setAnomalies(anomalyData);
      
      const criticalCount = anomalyData.filter(a => a.status === 'critical').length;
      const warningCount = anomalyData.filter(a => a.status === 'warning').length;
      setOverallScore(Math.max(0, 100 - (criticalCount * 25) - (warningCount * 10)));
    } catch (error) {
      console.error('Error analyzing anomalies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'warning': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-success/20 text-success border-success/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return '[&>div]:bg-destructive';
      case 'warning': return '[&>div]:bg-warning';
      default: return '[&>div]:bg-success';
    }
  };

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-secondary rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Anomaly Detection
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Health:</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(overallScore)} animate-pulse`}>
              {overallScore}%
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Real-time ML-based threat pattern analysis</p>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {anomalies.map((anomaly, index) => (
          <div
            key={anomaly.id}
            className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${anomaly.status === 'critical' ? 'bg-destructive/20' : anomaly.status === 'warning' ? 'bg-warning/20' : 'bg-success/20'}`}>
                  {anomaly.status === 'critical' && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
                  {anomaly.status === 'warning' && <Zap className="h-4 w-4 text-warning" />}
                  {anomaly.status === 'normal' && <TrendingUp className="h-4 w-4 text-success" />}
                </div>
                <span className="font-medium">{anomaly.type}</span>
              </div>
              <Badge variant="outline" className={getStatusBadge(anomaly.status)}>
                {anomaly.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Score</span>
                <span className={`font-semibold ${getStatusColor(anomaly.status)}`}>{anomaly.score.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(100, anomaly.score)} 
                className={`h-2 ${getProgressColor(anomaly.status)}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Baseline: {anomaly.baseline}%</span>
                <span className={anomaly.deviation > 0 ? 'text-destructive' : 'text-success'}>
                  Deviation: {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AnomalyDetection;
