import { useEffect, useState, useCallback } from "react";
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

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface AttackPoint {
  id: string;
  coordinates: [number, number];
  severity: string;
  name: string;
  threat_type: string;
}

interface AttackFlow {
  id: string;
  from: [number, number];
  to: [number, number];
  severity: string;
  threat_type: string;
  progress: number;
}

const attackOrigins: Record<string, [number, number]> = {
  Russia: [100, 60],
  China: [105, 35],
  "North Korea": [127, 40],
  Iran: [53, 32],
  USA: [-95, 38],
  Brazil: [-55, -10],
  India: [78, 22],
  Nigeria: [8, 10],
  UK: [-2, 54],
  Germany: [10, 51],
  France: [2, 47],
  Japan: [138, 36],
  Australia: [134, -25],
  Canada: [-106, 56],
  Unknown: [0, 20],
};

const attackTypeConfig: Record<string, { color: string; label: string }> = {
  apt: { color: "#ef4444", label: "APT Attacks" },
  exploit: { color: "#f97316", label: "Exploits" },
  ioc: { color: "#22d3ee", label: "IOC Indicators" },
  malware: { color: "#a855f7", label: "Malware" },
  vulnerability: { color: "#3b82f6", label: "Vulnerabilities" },
  phishing: { color: "#eab308", label: "Phishing" },
};

const targetLocations: [number, number][] = [
  [-95, 38], [10, 51], [139, 36], [8, 10], [-2, 54],
];

export const AttackMapWidget = () => {
  const [attackPoints, setAttackPoints] = useState<AttackPoint[]>([]);
  const [attackFlows, setAttackFlows] = useState<AttackFlow[]>([]);
  const [activeAttacks, setActiveAttacks] = useState(0);

  const fetchThreats = useCallback(async () => {
    try {
      const { data: threats } = await supabase
        .from("threats")
        .select("id, severity, country, source, threat_type")
        .order("created_at", { ascending: false })
        .limit(25);

      if (threats) {
        const points: AttackPoint[] = [];
        const flows: AttackFlow[] = [];

        threats.forEach((threat, idx) => {
          const coords =
            attackOrigins[threat.country || "Unknown"] ||
            attackOrigins.Unknown;

          // Add jitter so overlapping points separate
          const jitter: [number, number] = [
            coords[0] + (Math.random() - 0.5) * 6,
            coords[1] + (Math.random() - 0.5) * 4,
          ];

          points.push({
            id: threat.id,
            coordinates: jitter,
            severity: threat.severity,
            name: threat.country || "Unknown",
            threat_type: threat.threat_type,
          });

          const target =
            targetLocations[idx % targetLocations.length];

          flows.push({
            id: `flow-${idx}`,
            from: jitter,
            to: target,
            severity: threat.severity,
            threat_type: threat.threat_type,
            progress: Math.random() * 100,
          });
        });

        setAttackPoints(points);
        setAttackFlows(flows);
        setActiveAttacks(
          threats.filter(
            (t) => t.severity === "critical" || t.severity === "high"
          ).length
        );
      }
    } catch (error) {
      console.error("Error fetching threats for map:", error);
    }
  }, []);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 30000);
    return () => clearInterval(interval);
  }, [fetchThreats]);

  // Animate flow lines
  useEffect(() => {
    const anim = setInterval(() => {
      setAttackFlows((prev) =>
        prev.map((f) => ({ ...f, progress: (f.progress + 1.5) % 100 }))
      );
    }, 60);
    return () => clearInterval(anim);
  }, []);

  const getTypeColor = (type: string) =>
    attackTypeConfig[type]?.color || "#3b82f6";

  return (
    <Card className="col-span-2 border-border/50 overflow-hidden bg-[hsl(220,50%,4%)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-[hsl(220,50%,4%)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-cyan-50">
              Live Attack Map
            </CardTitle>
            <p className="text-xs text-cyan-200/50">
              Real-time threat visualization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-destructive animate-pulse" />
          <Badge
            variant="destructive"
            className="animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
          >
            {activeAttacks} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative h-[400px] overflow-hidden rounded-b-lg">
          <ComposableMap
            projectionConfig={{ scale: 140, center: [20, 15] }}
            className="w-full h-full"
            style={{ backgroundColor: "hsl(220 50% 4%)" }}
          >
            <defs>
              {attackFlows.map((flow) => (
                <linearGradient
                  key={`wg-${flow.id}`}
                  id={`wg-${flow.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop
                    offset="0%"
                    stopColor={getTypeColor(flow.threat_type)}
                    stopOpacity="0"
                  />
                  <stop
                    offset={`${Math.max(flow.progress - 15, 0)}%`}
                    stopColor={getTypeColor(flow.threat_type)}
                    stopOpacity="0"
                  />
                  <stop
                    offset={`${flow.progress}%`}
                    stopColor={getTypeColor(flow.threat_type)}
                    stopOpacity="0.9"
                  />
                  <stop
                    offset={`${Math.min(flow.progress + 5, 100)}%`}
                    stopColor={getTypeColor(flow.threat_type)}
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor={getTypeColor(flow.threat_type)}
                    stopOpacity="0"
                  />
                </linearGradient>
              ))}
            </defs>

            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="hsl(220 40% 12%)"
                    stroke="hsl(200 60% 25%)"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "hsl(220 40% 16%)", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Animated attack flow arcs */}
            {attackFlows.map((flow) => (
              <g key={flow.id}>
                {/* Static faint base line */}
                <Line
                  from={flow.from}
                  to={flow.to}
                  stroke={getTypeColor(flow.threat_type)}
                  strokeWidth={0.5}
                  strokeOpacity={0.08}
                  strokeLinecap="round"
                />
                {/* Animated gradient line */}
                <Line
                  from={flow.from}
                  to={flow.to}
                  stroke={`url(#wg-${flow.id})`}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* Origin markers with glow */}
            {attackPoints.map((point) => (
              <Marker key={point.id} coordinates={point.coordinates}>
                <circle
                  r={6}
                  fill={getTypeColor(point.threat_type)}
                  opacity={0.15}
                  className="animate-ping"
                />
                <circle
                  r={3}
                  fill={getTypeColor(point.threat_type)}
                  opacity={0.6}
                />
                <circle
                  r={1.5}
                  fill="#fff"
                  opacity={0.9}
                />
              </Marker>
            ))}

            {/* Target markers */}
            {targetLocations.map((coords, i) => (
              <Marker key={`target-${i}`} coordinates={coords}>
                <circle r={5} fill="#22d3ee" opacity={0.2} className="animate-ping" />
                <circle r={3} fill="#22d3ee" opacity={0.5} />
                <circle r={1.5} fill="#fff" opacity={0.9} />
              </Marker>
            ))}
          </ComposableMap>

          {/* Attack Types Legend */}
          <div className="absolute top-3 left-3 bg-[hsl(220,45%,8%)]/90 backdrop-blur-sm rounded-lg p-3 border border-cyan-900/30">
            <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              Attack Types
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(attackTypeConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: cfg.color,
                      boxShadow: `0 0 6px ${cfg.color}`,
                    }}
                  />
                  <span className="text-[10px] text-cyan-100/70">
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[hsl(220,45%,8%)]/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-cyan-900/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-medium text-cyan-100/70">LIVE</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
