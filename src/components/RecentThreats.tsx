import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield, Globe, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters } from "./SearchBar";
import { toast } from "@/hooks/use-toast";

interface RecentThreatsProps {
  filters: SearchFilters;
}

interface Threat {
  id: string;
  threat_type: string;
  title: string;
  indicator: string | null;
  country: string | null;
  severity: string;
  created_at: string;
  ai_summary: string | null;
  risk_insight: string | null;
  description: string | null;
}

const RecentThreats = ({ filters }: RecentThreatsProps) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchThreats = async () => {
    let query = supabase.from('threats').select('*');

    if (filters.severity && filters.severity.length > 0) {
      query = query.in('severity', filters.severity);
    }
    if (filters.threatType && filters.threatType.length > 0) {
      query = query.in('threat_type', filters.threatType);
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
    if (data) setThreats(data);
  };

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleAnalyze = async (threat: Threat) => {
    setAnalyzingId(threat.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-threat', {
        body: {
          threatId: threat.id,
          description: threat.description || threat.title,
          threatType: threat.threat_type,
          severity: threat.severity
        }
      });

      if (error) throw error;

      toast({ 
        title: "AI Analysis Complete", 
        description: "Threat has been analyzed" 
      });

      fetchThreats();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ 
        title: "Analysis failed", 
        description: "Could not analyze threat",
        variant: "destructive" 
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-destructive text-destructive-foreground",
      high: "bg-warning text-warning-foreground",
      medium: "bg-primary text-primary-foreground",
      low: "bg-success text-success-foreground"
    };
    return colors[severity] || "bg-secondary";
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Live Threat Feed</h2>
          <p className="text-sm text-muted-foreground">Real-time security incidents</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-destructive rounded-full animate-ping" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {threats.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No threats found</p>
        ) : (
          threats.map((threat) => (
            <div
              key={threat.id}
              className="p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="font-semibold">{threat.title}</span>
                </div>
                <Badge className={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span>Source: {threat.indicator || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Type: {threat.threat_type}</span>
                </div>
              </div>

              {threat.ai_summary && (
                <div className="mt-2 p-2 bg-primary/10 rounded text-sm">
                  <p className="text-primary font-semibold mb-1">AI Summary</p>
                  <p className="text-xs">{threat.ai_summary}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted-foreground">
                  {getTimeAgo(threat.created_at)}
                </div>
                {!threat.ai_summary && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAnalyze(threat)}
                    disabled={analyzingId === threat.id}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {analyzingId === threat.id ? 'Analyzing...' : 'AI Analyze'}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentThreats;
