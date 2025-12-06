import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Globe, AlertOctagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MaliciousIP {
  id: string;
  indicator: string;
  severity: string;
  description: string;
}

export const AbuseIPDBWidget = () => {
  const [ips, setIPs] = useState<MaliciousIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0 });

  useEffect(() => {
    const fetchIPs = async () => {
      try {
        const { data, error } = await supabase
          .from('threats')
          .select('id, indicator, severity, description')
          .eq('source', 'AbuseIPDB')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        const ipData = data || [];
        setIPs(ipData);
        
        setStats({
          total: ipData.length,
          critical: ipData.filter(ip => ip.severity === 'critical').length,
          high: ipData.filter(ip => ip.severity === 'high').length,
        });
      } catch (error) {
        console.error('Error fetching AbuseIPDB data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIPs();
  }, []);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">AbuseIPDB</CardTitle>
            <p className="text-xs text-muted-foreground">Malicious IP reputation</p>
          </div>
        </div>
        <Badge variant="outline" className="border-destructive/30 text-destructive">
          {stats.total} IPs tracked
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Blacklisted</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
            <p className="text-xs text-muted-foreground">Critical (90%+)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-warning/10">
            <p className="text-2xl font-bold text-warning">{stats.high}</p>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </div>
        </div>

        {/* IP List */}
        <ScrollArea className="h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : ips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertOctagon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No AbuseIPDB data yet</p>
              <p className="text-xs mt-1">Sync threat intelligence to fetch data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ips.map((ip) => (
                <div
                  key={ip.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-mono text-foreground">{ip.indicator}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {ip.description?.split('.')[0]}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      ip.severity === 'critical' && "border-destructive/50 text-destructive",
                      ip.severity === 'high' && "border-warning/50 text-warning",
                      ip.severity === 'medium' && "border-info/50 text-info"
                    )}
                  >
                    {ip.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
