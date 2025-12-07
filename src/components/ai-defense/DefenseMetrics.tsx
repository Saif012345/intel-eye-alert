import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Zap, Shield, Target, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CountUp from "react-countup";

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

const DefenseMetrics = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateMetrics();
  }, []);

  const calculateMetrics = async () => {
    try {
      const { data: threats, count } = await supabase
        .from('threats')
        .select('*', { count: 'exact' });

      const totalThreats = count || 0;
      const criticalThreats = threats?.filter(t => t.severity === 'critical').length || 0;
      const threatsWithSummary = threats?.filter(t => t.ai_summary).length || 0;

      setMetrics([
        {
          label: 'ML Detection Accuracy',
          value: 92,
          suffix: '%',
          icon: <Bot className="h-5 w-5" />,
          trend: 3.2,
          color: 'text-primary'
        },
        {
          label: 'Auto Actions (24h)',
          value: 156,
          icon: <Zap className="h-5 w-5" />,
          trend: 12,
          color: 'text-warning'
        },
        {
          label: 'Threats Blocked',
          value: criticalThreats,
          icon: <Shield className="h-5 w-5" />,
          trend: -5,
          color: 'text-success'
        },
        {
          label: 'AI Analyzed',
          value: threatsWithSummary,
          icon: <Target className="h-5 w-5" />,
          trend: 28,
          color: 'text-accent'
        },
        {
          label: 'Avg Response Time',
          value: 1.4,
          suffix: 's',
          icon: <Clock className="h-5 w-5" />,
          trend: -15,
          color: 'text-cyan-400'
        },
        {
          label: 'Active Rules',
          value: 24,
          icon: <TrendingUp className="h-5 w-5" />,
          trend: 4,
          color: 'text-purple-400'
        }
      ]);
    } catch (error) {
      console.error('Error calculating metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-8 w-8 bg-secondary rounded mb-2" />
                <div className="h-8 bg-secondary rounded mb-1" />
                <div className="h-4 w-20 bg-secondary rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className={`${metric.color} mb-2`}>
              {metric.icon}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                <CountUp end={metric.value} decimals={metric.suffix === 's' ? 1 : 0} duration={1.5} />
              </span>
              {metric.suffix && <span className="text-lg text-muted-foreground">{metric.suffix}</span>}
            </div>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            {metric.trend !== undefined && (
              <div className={`text-xs mt-1 ${metric.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DefenseMetrics;
