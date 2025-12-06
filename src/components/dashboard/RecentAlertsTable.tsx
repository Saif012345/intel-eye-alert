import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AlertTriangle, ExternalLink, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  severity: string;
  source: string;
  threat_type: string;
  created_at: string;
}

export const RecentAlertsTable = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('threats')
          .select('id, title, severity, source, threat_type, created_at')
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: "bg-destructive/20 text-destructive border-destructive/30",
      high: "bg-warning/20 text-warning border-warning/30",
      medium: "bg-info/20 text-info border-info/30",
      low: "bg-accent/20 text-accent border-accent/30",
    };

    return (
      <Badge 
        variant="outline" 
        className={cn("font-medium", variants[severity] || variants.medium)}
      >
        {severity}
      </Badge>
    );
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
            <p className="text-xs text-muted-foreground">Latest threat detections</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          View All
          <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Threat</TableHead>
              <TableHead className="text-muted-foreground">Severity</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Source</TableHead>
              <TableHead className="text-muted-foreground text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading alerts...
                  </div>
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No alerts found
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow 
                  key={alert.id} 
                  className="border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {alert.title}
                  </TableCell>
                  <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {alert.threat_type.replace(/-/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {alert.source}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
