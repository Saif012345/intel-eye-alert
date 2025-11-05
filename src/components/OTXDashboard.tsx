import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw, AlertTriangle, Globe, Hash, FileWarning } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OTXThreat {
  id: string;
  threat_type: string;
  severity: string;
  title: string;
  description: string;
  source: string;
  indicator: string | null;
  created_at: string;
}

const OTXDashboard = () => {
  const [threats, setThreats] = useState<OTXThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOTXThreats();
  }, []);

  const fetchOTXThreats = async () => {
    try {
      const { data, error } = await supabase
        .from('threats')
        .select('*')
        .or('source.eq.AlienVault OTX,source.eq.AlienVault OTX - IOC')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setThreats(data || []);
    } catch (error) {
      console.error('Error fetching OTX threats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AlienVault OTX data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to sync threat intelligence",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-threat-intelligence', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: data.message || "Threat intelligence updated successfully",
      });
      
      fetchOTXThreats();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync threat intelligence",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('ip')) return <Globe className="h-4 w-4" />;
    if (type.includes('hash')) return <Hash className="h-4 w-4" />;
    if (type.includes('domain')) return <Globe className="h-4 w-4" />;
    return <FileWarning className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const pulses = threats.filter(t => t.source === 'AlienVault OTX');
  const iocs = threats.filter(t => t.source === 'AlienVault OTX - IOC');

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pulses</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pulses.length}</div>
            <p className="text-xs text-muted-foreground">From AlienVault OTX</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IOCs Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{iocs.length}</div>
            <p className="text-xs text-muted-foreground">Indicators of Compromise</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {threats.filter(t => t.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      <div className="flex justify-end">
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Latest Threats'}
        </Button>
      </div>

      {/* Recent Pulses */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Recent Threat Pulses
          </CardTitle>
          <CardDescription>
            Latest threat intelligence from AlienVault OTX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {pulses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pulses found. Click "Sync Latest Threats" to fetch data.
                </p>
              ) : (
                pulses.map((threat) => (
                  <div
                    key={threat.id}
                    className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{threat.title}</h3>
                      <Badge variant={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {threat.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {threat.threat_type}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(threat.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* IOCs */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Indicators of Compromise (IOCs)
          </CardTitle>
          <CardDescription>
            IPs, domains, and hashes associated with threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {iocs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No IOCs found. Click "Sync Latest Threats" to fetch data.
                </p>
              ) : (
                iocs.map((ioc) => (
                  <div
                    key={ioc.id}
                    className="p-3 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(ioc.threat_type)}
                      <span className="font-mono text-sm">{ioc.indicator}</span>
                      <Badge variant={getSeverityColor(ioc.severity)} className="ml-auto">
                        {ioc.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      {ioc.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTXDashboard;
