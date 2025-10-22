import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters } from "./SearchBar";
import { Progress } from "@/components/ui/progress";

interface CVEFeedProps {
  filters: SearchFilters;
}

interface CVE {
  id: string;
  title: string;
  severity: string;
  created_at: string;
  description: string | null;
  cvss_score?: number;
}

const CVEFeed = ({ filters }: CVEFeedProps) => {
  const [cves, setCves] = useState<CVE[]>([]);

  useEffect(() => {
    const fetchCVEs = async () => {
      let query = supabase
        .from('threats')
        .select('*')
        .eq('threat_type', 'vulnerability');

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,indicator.ilike.%${filters.search}%`);
      }

      const { data } = await query.order('created_at', { ascending: false }).limit(5);
    if (data) {
      const cvesWithScores = data.map(cve => ({
        ...cve,
        cvss_score: Math.random() * 10
      }));
      setCves(cvesWithScores);
    }
  };

    fetchCVEs();
  }, [filters]);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-destructive text-destructive-foreground",
      high: "bg-warning text-warning-foreground",
      medium: "bg-primary text-primary-foreground",
      low: "bg-success text-success-foreground"
    };
    return colors[severity] || "bg-secondary";
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return "hsl(var(--destructive))";
    if (score >= 7.0) return "hsl(var(--warning))";
    if (score >= 4.0) return "hsl(var(--primary))";
    return "hsl(var(--success))";
  };

  const getCVSSLabel = (score: number) => {
    if (score >= 9.0) return "Critical";
    if (score >= 7.0) return "High";
    if (score >= 4.0) return "Medium";
    return "Low";
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Latest CVEs</h2>
        <p className="text-sm text-muted-foreground">Recent vulnerability disclosures</p>
      </div>
      
      <div className="space-y-3">
        {cves.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No CVEs found</p>
        ) : (
          cves.map((cve) => (
            <div
              key={cve.id}
              className="p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-destructive" />
                  <span className="font-mono font-semibold text-sm">{cve.id.slice(0, 13)}</span>
                </div>
                <Badge className={getSeverityColor(cve.severity)}>{cve.severity}</Badge>
              </div>
              
              <p className="text-sm mb-3">{cve.title}</p>

              {cve.cvss_score !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CVSS Score</span>
                    <span className="font-mono font-bold" style={{ color: getCVSSColor(cve.cvss_score) }}>
                      {cve.cvss_score.toFixed(1)} - {getCVSSLabel(cve.cvss_score)}
                    </span>
                  </div>
                  <Progress 
                    value={cve.cvss_score * 10} 
                    className="h-2"
                    style={{
                      '--progress-color': getCVSSColor(cve.cvss_score)
                    } as React.CSSProperties}
                  />
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Published: {getTimeAgo(cve.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CVEFeed;
