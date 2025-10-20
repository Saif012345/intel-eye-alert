import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug } from "lucide-react";

const cves = [
  {
    id: "CVE-2025-1234",
    title: "Remote Code Execution in Apache",
    score: 9.8,
    severity: "Critical",
    severityColor: "bg-destructive text-destructive-foreground",
    published: "Today",
  },
  {
    id: "CVE-2025-1189",
    title: "Privilege Escalation in Linux Kernel",
    score: 8.4,
    severity: "High",
    severityColor: "bg-warning text-warning-foreground",
    published: "Yesterday",
  },
  {
    id: "CVE-2025-1156",
    title: "SQL Injection in WordPress Plugin",
    score: 7.5,
    severity: "High",
    severityColor: "bg-warning text-warning-foreground",
    published: "2 days ago",
  },
  {
    id: "CVE-2025-1098",
    title: "XSS Vulnerability in React Component",
    score: 6.2,
    severity: "Medium",
    severityColor: "bg-primary text-primary-foreground",
    published: "3 days ago",
  },
  {
    id: "CVE-2025-1045",
    title: "Buffer Overflow in OpenSSL",
    score: 9.1,
    severity: "Critical",
    severityColor: "bg-destructive text-destructive-foreground",
    published: "4 days ago",
  },
];

const CVEFeed = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Latest CVEs</h2>
        <p className="text-sm text-muted-foreground">Recent vulnerability disclosures</p>
      </div>
      
      <div className="space-y-3">
        {cves.map((cve) => (
          <div
            key={cve.id}
            className="p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-destructive" />
                <span className="font-mono font-semibold text-sm">{cve.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cve.severityColor}>{cve.severity}</Badge>
                <span className="text-sm font-bold">{cve.score}</span>
              </div>
            </div>
            
            <p className="text-sm mb-2">{cve.title}</p>
            
            <div className="text-xs text-muted-foreground">
              Published: {cve.published}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CVEFeed;
