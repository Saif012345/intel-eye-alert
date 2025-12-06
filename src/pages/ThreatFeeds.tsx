import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Rss, Search } from "lucide-react";

const ThreatFeeds = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Threat Feeds</h1>
            <p className="text-muted-foreground">Real-time threat intelligence feeds</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search feeds..." className="pl-10" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['NVD CVE Feed', 'AlienVault OTX', 'AbuseIPDB', 'Shodan'].map((feed) => (
            <Card key={feed} className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Rss className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{feed}</CardTitle>
                  <Badge variant="outline" className="mt-1">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Live threat intelligence from {feed}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ThreatFeeds;
