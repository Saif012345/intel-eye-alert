import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const IOCs = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IOCs Database</h1>
            <p className="text-muted-foreground">Indicators of Compromise</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search IOCs..." className="pl-10" />
          </div>
        </div>
        
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              IOC Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Search and filter IOCs by IP, domain, hash, or URL.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IOCs;
