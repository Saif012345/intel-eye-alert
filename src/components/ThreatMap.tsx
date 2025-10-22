import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { supabase } from "@/integrations/supabase/client";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatLocation {
  id: string;
  coordinates: [number, number];
  severity: string;
  country: string;
  title: string;
}

const ThreatMap = () => {
  const [threats, setThreats] = useState<ThreatLocation[]>([]);
  const [connections, setConnections] = useState<Array<{ from: [number, number]; to: [number, number]; severity: string }>>([]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchThreats = async () => {
    const { data } = await supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);

    if (data) {
      const locations: ThreatLocation[] = data.map((threat, idx) => ({
        id: threat.id,
        coordinates: getRandomCoordinates(),
        severity: threat.severity,
        country: threat.country || 'Unknown',
        title: threat.title
      }));
      setThreats(locations);

      // Generate random connections
      const newConnections = [];
      for (let i = 0; i < Math.min(5, locations.length - 1); i++) {
        newConnections.push({
          from: locations[i].coordinates,
          to: locations[i + 1].coordinates,
          severity: locations[i].severity
        });
      }
      setConnections(newConnections);
    }
  };

  const getRandomCoordinates = (): [number, number] => {
    const coords: [number, number][] = [
      [-74, 40], [0, 51], [139, 35], [-122, 37], [2, 48],
      [37, 55], [-43, -22], [151, -33], [13, 52], [121, 31],
      [72, 19], [-99, 19], [103, 1], [77, 28], [-3, 40]
    ];
    return coords[Math.floor(Math.random() * coords.length)];
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "#dc2626",
      high: "#ea580c",
      medium: "#38bdf8",
      low: "#10b981"
    };
    return colors[severity] || "#38bdf8";
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Global Threat Map</h2>
        <p className="text-sm text-muted-foreground">Real-time attack origins and targets</p>
      </div>
      
      <div className="relative w-full h-[500px] bg-secondary rounded-lg border border-border overflow-hidden">
        <ComposableMap
          projectionConfig={{
            scale: 147,
          }}
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#334155" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Animated connection lines */}
          {connections.map((conn, idx) => (
            <Line
              key={`line-${idx}`}
              from={conn.from}
              to={conn.to}
              stroke={getSeverityColor(conn.severity)}
              strokeWidth={1}
              strokeLinecap="round"
              strokeOpacity={0.4}
              className="animate-pulse"
            />
          ))}

          {/* Threat markers */}
          {threats.map((threat) => (
            <Marker key={threat.id} coordinates={threat.coordinates}>
              <circle
                r={4}
                fill={getSeverityColor(threat.severity)}
                className="animate-ping"
                style={{
                  filter: `drop-shadow(0 0 8px ${getSeverityColor(threat.severity)})`
                }}
              />
              <circle
                r={4}
                fill={getSeverityColor(threat.severity)}
                opacity={0.8}
              />
            </Marker>
          ))}
        </ComposableMap>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-4 text-xs bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded-full" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span>Low</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ThreatMap;
