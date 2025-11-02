import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Shield, MapPin } from "lucide-react";

interface Threat {
  id: string;
  title: string;
  description: string;
  severity: string;
  threat_type: string;
  source: string;
  created_at: string;
}

const NigeriaThreats = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });

  useEffect(() => {
    fetchNigeriaThreats();
  }, []);

  const fetchNigeriaThreats = async () => {
    try {
      const { data, error } = await supabase
        .from("threats")
        .select("*")
        .eq("country", "Nigeria")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setThreats(data || []);
      
      const critical = data?.filter(t => t.severity === "critical").length || 0;
      const high = data?.filter(t => t.severity === "high").length || 0;
      
      setStats({
        total: data?.length || 0,
        critical,
        high
      });
    } catch (error) {
      console.error("Error fetching Nigeria threats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            Nigeria Threat Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading Nigeria threats...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            Nigeria Threat Intelligence
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              {stats.critical} Critical
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
              {stats.high} High
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {threats.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No threats detected for Nigeria</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Sync Threats" to fetch latest data</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {threats.map((threat) => (
                <div
                  key={threat.id}
                  className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-accent/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm flex-1">{threat.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={getSeverityColor(threat.severity)}
                    >
                      {threat.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {threat.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Type: <span className="text-foreground capitalize">{threat.threat_type}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Source: <span className="text-accent">{threat.source}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default NigeriaThreats;
