import { Shield, AlertTriangle, Database, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  {
    title: "Critical Alerts",
    value: "47",
    change: "+12%",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
  },
  {
    title: "Active Threats",
    value: "2,847",
    change: "-3%",
    icon: Shield,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  {
    title: "CVEs Tracked",
    value: "18,392",
    change: "+156",
    icon: Database,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    title: "Countries Monitored",
    value: "195",
    change: "100%",
    icon: Globe,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
];

const ThreatStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                <p className={`text-sm ${stat.color}`}>{stat.change} from last week</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} border ${stat.borderColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ThreatStats;
