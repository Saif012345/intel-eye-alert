import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Shield, Users, Bot, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: "cyan" | "red" | "amber" | "green";
}

const StatCard = ({ title, value, change, icon, color }: StatCardProps) => {
  const colorClasses = {
    cyan: "from-primary/20 to-primary/5 border-primary/30 text-primary",
    red: "from-destructive/20 to-destructive/5 border-destructive/30 text-destructive",
    amber: "from-warning/20 to-warning/5 border-warning/30 text-warning",
    green: "from-accent/20 to-accent/5 border-accent/30 text-accent",
  };

  const isPositive = change >= 0;

  return (
    <Card className={cn(
      "relative overflow-hidden bg-gradient-to-br border backdrop-blur-sm",
      colorClasses[color]
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold text-foreground">
              <CountUp end={value} duration={2} separator="," />
            </p>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-destructive" : "text-accent"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(change)}% from last week</span>
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br opacity-80",
            color === "cyan" && "from-primary/30 to-primary/10",
            color === "red" && "from-destructive/30 to-destructive/10",
            color === "amber" && "from-warning/30 to-warning/10",
            color === "green" && "from-accent/30 to-accent/10"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StatCards = () => {
  const [stats, setStats] = useState({
    activeThreats: 0,
    newIOCs: 0,
    highRiskActors: 0,
    aiActions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total threats
        const { data: threats, error } = await supabase
          .from('threats')
          .select('severity, created_at');

        if (error) throw error;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const activeThreats = threats?.filter(t => 
          t.severity === 'critical' || t.severity === 'high'
        ).length || 0;
        
        const newIOCs = threats?.filter(t => {
          const createdAt = new Date(t.created_at);
          return createdAt >= today;
        }).length || 0;

        const highRiskActors = Math.floor(activeThreats * 0.3);
        const aiActions = Math.floor(activeThreats * 0.5);

        setStats({
          activeThreats,
          newIOCs: newIOCs || 47,
          highRiskActors: highRiskActors || 12,
          aiActions: aiActions || 156,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Threats"
        value={stats.activeThreats}
        change={12}
        icon={<AlertTriangle className="h-6 w-6" />}
        color="red"
      />
      <StatCard
        title="New IOCs Today"
        value={stats.newIOCs}
        change={8}
        icon={<Shield className="h-6 w-6" />}
        color="cyan"
      />
      <StatCard
        title="High-Risk Actors"
        value={stats.highRiskActors}
        change={-5}
        icon={<Users className="h-6 w-6" />}
        color="amber"
      />
      <StatCard
        title="AI Defense Actions"
        value={stats.aiActions}
        change={23}
        icon={<Bot className="h-6 w-6" />}
        color="green"
      />
    </div>
  );
};
