import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

const actors = [
  { name: "APT29", origin: "Russia", targets: ["Government", "Healthcare"], severity: "critical" },
  { name: "Lazarus Group", origin: "North Korea", targets: ["Finance", "Crypto"], severity: "critical" },
  { name: "APT41", origin: "China", targets: ["Tech", "Telecom"], severity: "high" },
];

const Actors = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Actors & Campaigns</h1>
          <p className="text-muted-foreground">Threat actor profiles and campaigns</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actors.map((actor) => (
            <Card key={actor.name} className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Users className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg">{actor.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{actor.origin}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {actor.targets.map((target) => (
                    <Badge key={target} variant="secondary" className="text-xs">{target}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Actors;
