import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield, Globe } from "lucide-react";

const threats = [
  {
    id: 1,
    type: "Ransomware",
    source: "185.220.101.47",
    target: "Financial Services",
    severity: "Critical",
    severityColor: "bg-destructive text-destructive-foreground",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "DDoS Attack",
    source: "203.0.113.89",
    target: "E-commerce Platform",
    severity: "High",
    severityColor: "bg-warning text-warning-foreground",
    time: "8 minutes ago",
  },
  {
    id: 3,
    type: "Phishing Campaign",
    source: "malicious-domain.xyz",
    target: "Healthcare Sector",
    severity: "High",
    severityColor: "bg-warning text-warning-foreground",
    time: "15 minutes ago",
  },
  {
    id: 4,
    type: "SQL Injection",
    source: "104.21.45.12",
    target: "Government Portal",
    severity: "Critical",
    severityColor: "bg-destructive text-destructive-foreground",
    time: "23 minutes ago",
  },
  {
    id: 5,
    type: "Malware Distribution",
    source: "cdn-malicious.com",
    target: "Education Network",
    severity: "Medium",
    severityColor: "bg-primary text-primary-foreground",
    time: "31 minutes ago",
  },
];

const RecentThreats = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Live Threat Feed</h2>
        <p className="text-sm text-muted-foreground">Real-time security incidents</p>
      </div>
      
      <div className="space-y-3">
        {threats.map((threat) => (
          <div
            key={threat.id}
            className="p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="font-semibold">{threat.type}</span>
              </div>
              <Badge className={threat.severityColor}>{threat.severity}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span>Source: {threat.source}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-3 h-3" />
                <span>Target: {threat.target}</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {threat.time}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentThreats;
