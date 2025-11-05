import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Server, Wifi, Shield, AlertOctagon, RefreshCw, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExposedDevice {
  id: string;
  threat_type: string;
  severity: string;
  title: string;
  description: string;
  source: string;
  indicator: string | null;
  created_at: string;
}

const ShodanDashboard = () => {
  const [devices, setDevices] = useState<ExposedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchShodanDevices();
  }, []);

  const fetchShodanDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('threats')
        .select('*')
        .eq('source', 'Shodan')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching Shodan devices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exposed devices data",
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
      
      fetchShodanDevices();
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

  const getDeviceIcon = (type: string) => {
    if (type.includes('ssh')) return <Server className="h-4 w-4" />;
    if (type.includes('rdp')) return <Network className="h-4 w-4" />;
    if (type.includes('smb')) return <Wifi className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
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

  const getDeviceTypeLabel = (type: string) => {
    if (type.includes('ssh')) return 'SSH';
    if (type.includes('rdp')) return 'RDP';
    if (type.includes('smb')) return 'SMB';
    if (type.includes('telnet')) return 'Telnet';
    return 'Device';
  };

  const exposedSSH = devices.filter(d => d.threat_type.includes('ssh'));
  const exposedRDP = devices.filter(d => d.threat_type.includes('rdp'));
  const exposedSMB = devices.filter(d => d.threat_type.includes('smb'));
  const criticalDevices = devices.filter(d => d.severity === 'critical');

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exposed</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">Internet-facing devices</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Devices</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalDevices.length}</div>
            <p className="text-xs text-muted-foreground">With vulnerabilities</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exposed SSH</CardTitle>
            <Server className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exposedSSH.length}</div>
            <p className="text-xs text-muted-foreground">Port 22 open</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exposed RDP</CardTitle>
            <Network className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exposedRDP.length}</div>
            <p className="text-xs text-muted-foreground">Port 3389 open</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Button */}
      <div className="flex justify-end">
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Exposed Devices'}
        </Button>
      </div>

      {/* Exposed Devices List */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Exposed Devices & Services
          </CardTitle>
          <CardDescription>
            Internet-facing devices discovered via Shodan in Nigeria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {devices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No exposed devices found. Click "Sync Exposed Devices" to scan for devices.
                </p>
              ) : (
                devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 rounded-lg border border-border hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.threat_type)}
                        <h3 className="font-semibold text-sm">{device.title}</h3>
                      </div>
                      <Badge variant={getSeverityColor(device.severity)}>
                        {device.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {device.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getDeviceTypeLabel(device.threat_type)}
                      </Badge>
                      {device.indicator && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{device.indicator}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(device.created_at).toLocaleDateString()}</span>
                    </div>
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

export default ShodanDashboard;
