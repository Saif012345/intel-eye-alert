import { Card, CardContent } from "@/components/ui/card";
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
  glowClass: string;
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

      const criticalThreats = threats?.filter(t => t.severity === 'critical').length || 0;
      const threatsWithSummary = threats?.filter(t => t.ai_summary).length || 0;

      setMetrics([
        {
          label: 'ML Detection Accuracy',
          value: 92,
          suffix: '%',
          icon: <Bot className="h-5 w-5" />,
          trend: 3.2,
          color: 'text-primary',
          glowClass: 'glow-cyan'
        },
        {
          label: 'Auto Actions (24h)',
          value: 156,
          icon: <Zap className="h-5 w-5" />,
          trend: 12,
          color: 'text-warning',
          glowClass: 'glow-amber'
        },
        {
          label: 'Threats Blocked',
          value: criticalThreats,
          icon: <Shield className="h-5 w-5" />,
          trend: -5,
          color: 'text-success',
          glowClass: 'glow-green'
        },
        {
          label: 'AI Analyzed',
          value: threatsWithSummary,
          icon: <Target className="h-5 w-5" />,
          trend: 28,
          color: 'text-accent',
          glowClass: 'glow-green'
        },
        {
          label: 'Avg Response Time',
          value: 1.4,
          suffix: 's',
          icon: <Clock className="h-5 w-5" />,
          trend: -15,
          color: 'text-info',
          glowClass: 'glow-cyan'
        },
        {
          label: 'Active Rules',
          value: 24,
          icon: <TrendingUp className="h-5 w-5" />,
          trend: 4,
          color: 'text-purple-400',
          glowClass: 'glow-cyan'
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
        <div key={index} className="relative group">
          <div className={`absolute inset-0 ${metric.glowClass} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
          <Card className="relative glass border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5" />
            <CardContent className="relative p-4">
              <div className={`${metric.color} mb-2 transition-transform duration-300 group-hover:scale-110`}>
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
                <div className={`text-xs mt-1 flex items-center gap-1 ${metric.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                  <span className="font-medium">{metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default DefenseMetrics;
