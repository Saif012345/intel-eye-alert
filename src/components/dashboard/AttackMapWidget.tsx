import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { Globe, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface AttackPoint {
  id: string;
  coordinates: [number, number];
  severity: string;
  name: string;
}

interface AttackLine {
  from: [number, number];
  to: [number, number];
  severity: string;
}

// Sample attack origins (simulated for demo)
const attackOrigins: { [key: string]: [number, number] } = {
  "Russia": [37.6173, 55.7558],
  "China": [116.4074, 39.9042],
  "North Korea": [125.7625, 39.0392],
  "Iran": [51.3890, 35.6892],
  "USA": [-77.0369, 38.9072],
  "Brazil": [-43.1729, -22.9068],
  "India": [77.2090, 28.6139],
  "Nigeria": [3.3792, 6.5244],
  "UK": [-0.1276, 51.5074],
  "Germany": [13.4050, 52.5200],
};

// Nigeria as target
const targetLocation: [number, number] = [7.4951, 9.0579];

export const AttackMapWidget = () => {
  const [attackPoints, setAttackPoints] = useState<AttackPoint[]>([]);
  const [attackLines, setAttackLines] = useState<AttackLine[]>([]);
  const [activeAttacks, setActiveAttacks] = useState(0);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const { data: threats } = await supabase
          .from('threats')
          .select('id, severity, country, source')
          .order('created_at', { ascending: false })
          .limit(20);

        if (threats) {
          const points: AttackPoint[] = [];
          const lines: AttackLine[] = [];
          const origins = Object.entries(attackOrigins);

          threats.forEach((threat, index) => {
            const origin = origins[index % origins.length];
            const [name, coords] = origin;
            
            points.push({
              id: threat.id,
              coordinates: coords,
              severity: threat.severity,
              name: name,
            });

            lines.push({
              from: coords,
              to: targetLocation,
              severity: threat.severity,
            });
          });

          setAttackPoints(points);
          setAttackLines(lines);
          setActiveAttacks(threats.filter(t => 
            t.severity === 'critical' || t.severity === 'high'
          ).length);
        }
      } catch (error) {
        console.error('Error fetching threats for map:', error);
      }
    };

    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  return (
    <Card className="col-span-2 glass border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Live Attack Map</CardTitle>
            <p className="text-xs text-muted-foreground">Real-time threat visualization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-destructive animate-pulse" />
          <Badge variant="destructive" className="animate-pulse-glow-red">
            {activeAttacks} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] overflow-hidden rounded-b-lg">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [20, 10],
            }}
            className="w-full h-full"
            style={{ backgroundColor: 'hsl(222 47% 5%)' }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="hsl(222 40% 15%)"
                    stroke="hsl(222 40% 25%)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: 'hsl(222 40% 20%)', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Attack lines */}
            {attackLines.map((line, index) => (
              <Line
                key={index}
                from={line.from}
                to={line.to}
                stroke={getSeverityColor(line.severity)}
                strokeWidth={1.5}
                strokeLinecap="round"
                className="attack-line"
                style={{
                  opacity: 0.6,
                }}
              />
            ))}

            {/* Attack origin points */}
            {attackPoints.map((point) => (
              <Marker key={point.id} coordinates={point.coordinates}>
                <circle
                  r={4}
                  fill={getSeverityColor(point.severity)}
                  className="blink-point"
                />
                <circle
                  r={8}
                  fill={getSeverityColor(point.severity)}
                  opacity={0.3}
                  className="blink-point"
                />
              </Marker>
            ))}

            {/* Target marker (Nigeria) */}
            <Marker coordinates={targetLocation}>
              <circle r={8} fill="hsl(186 100% 50%)" className="animate-pulse-glow" />
              <circle r={12} fill="hsl(186 100% 50%)" opacity={0.3} />
              <circle r={16} fill="hsl(186 100% 50%)" opacity={0.1} />
            </Marker>
          </ComposableMap>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive"></span>
                <span className="text-muted-foreground">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent"></span>
                <span className="text-muted-foreground">Low</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
