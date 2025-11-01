import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeftRight, X } from "lucide-react";

interface Threat {
  id: string;
  title: string;
  threat_type: string;
  severity: string;
  description: string;
  source: string;
  indicator: string;
  country: string;
  created_at: string;
  ai_summary: string;
  risk_insight: string;
}

const ThreatComparison = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [selectedThreats, setSelectedThreats] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchThreats();
  }, []);

  const fetchThreats = async () => {
    const { data } = await supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setThreats(data);
  };

  const toggleThreat = (id: string) => {
    setSelectedThreats(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-muted text-foreground';
      case 'low': return 'bg-success/20 text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedThreatsData = threats.filter(t => selectedThreats.includes(t.id));

  if (comparing && selectedThreatsData.length > 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Threat Comparison</h2>
            <p className="text-sm text-muted-foreground">Side-by-side analysis of {selectedThreatsData.length} threats</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setComparing(false)}
            size="sm"
          >
            <X className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedThreatsData.map((threat) => (
            <Card key={threat.id} className="p-4 bg-secondary border-border">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{threat.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getSeverityColor(threat.severity)} variant="secondary">
                      {threat.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{threat.threat_type}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Source:</span>
                    <p className="text-foreground">{threat.source}</p>
                  </div>
                  
                  {threat.indicator && (
                    <div>
                      <span className="text-muted-foreground">Indicator:</span>
                      <p className="text-foreground font-mono">{threat.indicator}</p>
                    </div>
                  )}
                  
                  {threat.country && (
                    <div>
                      <span className="text-muted-foreground">Origin:</span>
                      <p className="text-foreground">{threat.country}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="text-foreground line-clamp-3">{threat.description}</p>
                  </div>

                  {threat.ai_summary && (
                    <div>
                      <span className="text-primary">AI Summary:</span>
                      <p className="text-foreground line-clamp-3">{threat.ai_summary}</p>
                    </div>
                  )}

                  {threat.risk_insight && (
                    <div>
                      <span className="text-warning">Risk Insight:</span>
                      <p className="text-foreground line-clamp-2">{threat.risk_insight}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Threat Comparison</h2>
        <p className="text-sm text-muted-foreground">Select up to 3 threats to compare side-by-side</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline">
          {selectedThreats.length}/3 selected
        </Badge>
        <Button
          onClick={() => setComparing(true)}
          disabled={selectedThreats.length < 2}
          className="bg-primary hover:bg-primary/90"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          Compare Selected
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {threats.map((threat) => (
            <div
              key={threat.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                selectedThreats.includes(threat.id)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary border-border hover:border-primary/50'
              }`}
              onClick={() => toggleThreat(threat.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedThreats.includes(threat.id)}
                  onCheckedChange={() => toggleThreat(threat.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2">{threat.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getSeverityColor(threat.severity)} variant="secondary">
                      {threat.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize">{threat.threat_type}</Badge>
                    {threat.country && <Badge variant="outline">{threat.country}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default ThreatComparison;