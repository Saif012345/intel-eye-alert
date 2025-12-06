import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Rss, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface IntelItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  source: string;
  created_at: string;
}

export const LatestIntelFeed = () => {
  const [intel, setIntel] = useState<IntelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const { data, error } = await supabase
          .from('threats')
          .select('id, title, description, severity, source, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setIntel(data || []);
      } catch (error) {
        console.error('Error fetching intel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntel();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('threats-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'threats' },
        (payload) => {
          setIntel((prev) => [payload.new as IntelItem, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-destructive';
      case 'high': return 'border-l-warning';
      case 'medium': return 'border-l-info';
      default: return 'border-l-accent';
    }
  };

  return (
    <Card className="glass border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Rss className="h-5 w-5 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Latest Intelligence</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time threat feed</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : intel.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No intelligence data available
            </div>
          ) : (
            <div className="space-y-3">
              {intel.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg bg-secondary/30 border-l-4 hover:bg-secondary/50 transition-colors cursor-pointer",
                    getSeverityColor(item.severity)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground line-clamp-1">
                      {item.title}
                    </h4>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {item.source}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
