import { Shield, AlertTriangle, Database, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Tooltip } from "react-tooltip";
import { supabase } from "@/integrations/supabase/client";

const ThreatStats = () => {
  const [stats, setStats] = useState([
    {
      title: "Critical Alerts",
      value: 47,
      change: "+12%",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/30",
    },
    {
      title: "Active Threats",
      value: 2847,
      change: "-3%",
      icon: Shield,
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/30",
    },
    {
      title: "CVEs Tracked",
      value: 18392,
      change: "+156",
      icon: Database,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      title: "Countries Monitored",
      value: 195,
      change: "100%",
      icon: Globe,
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/30",
    },
  ]);

  useEffect(() => {
    fetchRealStats();
    const interval = setInterval(fetchRealStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRealStats = async () => {
    const { data: threats } = await supabase
      .from('threats')
      .select('severity, country');

    if (threats) {
      const critical = threats.filter(t => t.severity === 'critical').length;
      const countries = new Set(threats.map(t => t.country).filter(Boolean)).size;
      
      setStats(prev => [
        { ...prev[0], value: critical },
        { ...prev[1], value: threats.length },
        prev[2],
        { ...prev[3], value: countries },
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            data-tooltip-id={`tooltip-${stat.title}`}
            data-tooltip-content={`${stat.change} from last week`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold mb-2">
                  <CountUp end={stat.value} duration={2} separator="," />
                </h3>
                <p className={`text-sm ${stat.color}`}>{stat.change} from last week</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <Tooltip id={`tooltip-${stat.title}`} place="top" />
          </Card>
        );
      })}
    </div>
  );
};

export default ThreatStats;
