import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { useEffect, useState, useRef, Suspense, lazy, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Target, Activity, MapPin, Maximize2, Minimize2, Map, Volume2, VolumeX, Layers, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { playAlertSound, playAttackSound } from "@/lib/sounds";

const Globe3D = lazy(() => import("@/components/dashboard/Globe3D"));

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface ThreatLocation {
  id: string;
  coordinates: [number, number];
  severity: string;
  country: string;
  title: string;
  threat_type: string;
  created_at: string;
}

interface CountryStats {
  country: string;
  count: number;
  coordinates: [number, number];
}

interface AttackFlow {
  id: string;
  from: [number, number];
  to: [number, number];
  severity: string;
  threat_type: string;
  progress: number;
}

const countryCoordinates: Record<string, [number, number]> = {
  "United States": [-95, 38], USA: [-95, 38], Russia: [100, 60], China: [105, 35],
  Nigeria: [8, 10], Brazil: [-55, -10], India: [78, 22], Germany: [10, 51],
  "United Kingdom": [-2, 54], UK: [-2, 54], France: [2, 47], Japan: [138, 36],
  Australia: [134, -25], Canada: [-106, 56], Iran: [53, 32], "North Korea": [127, 40],
  Unknown: [0, 0],
};

const defaultCoords: [number, number][] = [
  [-74, 40], [0, 51], [139, 35], [-122, 37], [2, 48],
  [37, 55], [-43, -22], [151, -33], [13, 52], [121, 31],
  [72, 19], [-99, 19], [103, 1], [77, 28], [-3, 40],
];

const targetLocations: [number, number][] = [
  [-95, 38], [10, 51], [139, 36], [8, 10], [-2, 54],
];

const attackTypeConfig: Record<string, { color: string; label: string }> = {
  apt: { color: "#ef4444", label: "APT Attacks" },
  exploit: { color: "#f97316", label: "Exploits" },
  ioc: { color: "#22d3ee", label: "IOC Indicators" },
  malware: { color: "#a855f7", label: "Malware" },
  vulnerability: { color: "#3b82f6", label: "Vulnerabilities" },
  phishing: { color: "#eab308", label: "Phishing" },
  botnet: { color: "#10b981", label: "Botnets" },
  ransomware: { color: "#ec4899", label: "Ransomware" },
};

// Timeline bar component
const TimelineBar = ({ threats }: { threats: ThreatLocation[] }) => {
  const now = Date.now();
  const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
  const bucketCount = 48; // 30-min buckets
  const bucketSize = timeWindow / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = now - timeWindow + i * bucketSize;
    const bucketEnd = bucketStart + bucketSize;
    return threats.filter((t) => {
      const ts = new Date(t.created_at).getTime();
      return ts >= bucketStart && ts < bucketEnd;
    }).length;
  });

  const maxCount = Math.max(...buckets, 1);

  return (
    <div className="w-full bg-[hsl(220,45%,6%)] border-t border-cyan-900/30 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Attack Timeline — Last 24h</span>
        </div>
        <span className="text-[10px] text-cyan-200/40">{threats.length} total events</span>
      </div>
      <div className="flex items-end gap-[2px] h-12">
        {buckets.map((count, i) => {
          const height = count > 0 ? Math.max((count / maxCount) * 100, 8) : 2;
          const severity = count > maxCount * 0.7 ? "#ef4444" : count > maxCount * 0.4 ? "#f97316" : count > 0 ? "#22d3ee" : "hsl(220,40%,15%)";
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300 relative group cursor-pointer"
              style={{
                height: `${height}%`,
                backgroundColor: severity,
                boxShadow: count > 0 ? `0 0 4px ${severity}60` : "none",
                opacity: count > 0 ? 0.8 : 0.3,
              }}
            >
              {count > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-[hsl(220,45%,12%)] border border-cyan-900/40 px-2 py-1 rounded text-[9px] text-cyan-100 whitespace-nowrap">
                    {count} attack{count > 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] text-cyan-200/30">24h ago</span>
        <span className="text-[9px] text-cyan-200/30">Now</span>
      </div>
    </div>
  );
};

const AttackMap = () => {
  const [threats, setThreats] = useState<ThreatLocation[]>([]);
  const [attackFlows, setAttackFlows] = useState<AttackFlow[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapView, setMapView] = useState<"2d" | "3d">("2d");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(
    new Set(Object.keys(attackTypeConfig))
  );
  const [attacksPerSecond, setAttacksPerSecond] = useState(0);
  const attackTimestamps = useRef<number[]>([]);

  const toggleType = (type: string) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Track attacks per second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      attackTimestamps.current = attackTimestamps.current.filter((ts) => now - ts < 10000);
      setAttacksPerSecond(Math.round((attackTimestamps.current.length / 10) * 10) / 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("attack-map-threats")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "threats" }, (payload) => {
        const n = payload.new as any;
        attackTimestamps.current.push(Date.now());
        if (soundEnabled) {
          if (n.severity === "critical") playAlertSound("critical");
          else if (n.severity === "high") playAlertSound("high");
          else playAttackSound();
        }
        if (n.severity === "critical" || n.severity === "high") {
          toast.error(`New ${n.severity.toUpperCase()} Threat`, {
            description: `${n.title} from ${n.country || "Unknown"}`,
            duration: 5000,
          });
        }
        const coords = countryCoordinates[n.country || "Unknown"] || defaultCoords[Math.floor(Math.random() * defaultCoords.length)];
        setThreats((prev) => [
          { id: n.id, coordinates: coords, severity: n.severity, country: n.country || "Unknown", title: n.title, threat_type: n.threat_type, created_at: n.created_at },
          ...prev.slice(0, 49),
        ]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled]);

  // Fetch threats
  const fetchThreats = useCallback(async () => {
    let query = supabase.from("threats").select("*").order("created_at", { ascending: false }).limit(50);
    if (selectedSeverity !== "all") query = query.eq("severity", selectedSeverity);
    const { data } = await query;
    if (!data) return;

    const locations: ThreatLocation[] = data.map((t) => ({
      id: t.id,
      coordinates: countryCoordinates[t.country || "Unknown"] || defaultCoords[Math.floor(Math.random() * defaultCoords.length)],
      severity: t.severity,
      country: t.country || "Unknown",
      title: t.title,
      threat_type: t.threat_type,
      created_at: t.created_at,
    }));
    locations.forEach((l) => {
      l.coordinates = [l.coordinates[0] + (Math.random() - 0.5) * 5, l.coordinates[1] + (Math.random() - 0.5) * 3];
    });
    setThreats(locations);

    // Simulate some attacks/sec from existing data
    if (attackTimestamps.current.length === 0) {
      const simulated = data.length / 15;
      setAttacksPerSecond(Math.round(simulated * 10) / 10);
    }

    const statsMap: Record<string, number> = {};
    data.forEach((t) => { const c = t.country || "Unknown"; statsMap[c] = (statsMap[c] || 0) + 1; });
    setCountryStats(
      Object.entries(statsMap)
        .map(([country, count]) => ({ country, count, coordinates: (countryCoordinates[country] || [0, 0]) as [number, number] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    const flows: AttackFlow[] = locations.slice(0, 20).map((loc, i) => ({
      id: `flow-${i}`,
      from: loc.coordinates,
      to: targetLocations[i % targetLocations.length],
      severity: loc.severity,
      threat_type: loc.threat_type,
      progress: Math.random() * 100,
    }));
    setAttackFlows(flows);
  }, [selectedSeverity]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 15000);
    return () => clearInterval(interval);
  }, [fetchThreats]);

  // Animate flows
  useEffect(() => {
    const anim = setInterval(() => {
      setAttackFlows((prev) => prev.map((f) => ({ ...f, progress: (f.progress + 1.2) % 100 })));
    }, 50);
    return () => clearInterval(anim);
  }, []);

  const getTypeColor = (type: string) => attackTypeConfig[type]?.color || "#3b82f6";
  const getSeverityColor = (s: string) => ({ critical: "#ef4444", high: "#f97316", medium: "#3b82f6", low: "#22c55e" })[s] || "#3b82f6";

  const filteredFlows = attackFlows.filter((f) => enabledTypes.has(f.threat_type));
  const filteredThreats = threats.filter((t) => enabledTypes.has(t.threat_type));

  return (
    <DashboardLayout>
      <div className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-[hsl(220,50%,4%)] p-4 overflow-auto" : ""}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-cyan-400" />
              <span className="text-cyan-50">Global Attack Map</span>
            </h1>
            <p className="text-sm text-cyan-200/40">Real-time threat visualization and origin tracking</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Attack Counter */}
            <div className="flex items-center gap-2 bg-[hsl(220,40%,10%)] px-3 py-1.5 rounded-lg border border-cyan-900/40">
              <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-cyan-50 tabular-nums">{attacksPerSecond}</span>
                <span className="text-[8px] text-cyan-200/40 uppercase tracking-wider">atk/sec</span>
              </div>
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[130px] bg-[hsl(220,40%,10%)] border-cyan-900/40 text-cyan-100">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 bg-[hsl(220,40%,10%)] px-3 py-1.5 rounded-lg border border-cyan-900/40">
              <Layers className="h-4 w-4 text-cyan-400/60" />
              <span className="text-xs text-cyan-100/60">Heatmap</span>
              <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} className="scale-75" />
            </div>
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="bg-[hsl(220,40%,10%)] border-cyan-900/40 hover:bg-[hsl(220,40%,15%)]"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-cyan-400" /> : <VolumeX className="h-4 w-4 text-cyan-400/40" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-[hsl(220,40%,10%)] border-cyan-900/40 hover:bg-[hsl(220,40%,15%)]"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4 text-cyan-400" /> : <Maximize2 className="h-4 w-4 text-cyan-400" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: "Attacks/sec", value: attacksPerSecond, color: "#eab308" },
            { icon: Target, label: "Critical Attacks", value: filteredThreats.filter((t) => t.severity === "critical").length, color: "#ef4444" },
            { icon: Activity, label: "Active Threats", value: filteredThreats.length, color: "#f97316" },
            { icon: Globe, label: "Attack Flows", value: filteredFlows.length, color: "#22d3ee" },
          ].map((s) => (
            <Card key={s.label} className="bg-[hsl(220,45%,8%)] border-cyan-900/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15`, boxShadow: `0 0 12px ${s.color}30` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-cyan-50">{s.value}</p>
                    <p className="text-[10px] text-cyan-200/40">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map + Sidebar */}
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="bg-[hsl(220,50%,4%)] border-cyan-900/30 overflow-hidden">
              <Tabs value={mapView} onValueChange={(v) => setMapView(v as "2d" | "3d")} className="w-full">
                <div className="flex items-center justify-between px-4 pt-3">
                  <TabsList className="grid w-[200px] grid-cols-2 bg-[hsl(220,40%,10%)]">
                    <TabsTrigger value="2d" className="gap-1 text-cyan-100 data-[state=active]:bg-cyan-900/40">
                      <Map className="h-3 w-3" /> 2D Map
                    </TabsTrigger>
                    <TabsTrigger value="3d" className="gap-1 text-cyan-100 data-[state=active]:bg-cyan-900/40">
                      <Globe className="h-3 w-3" /> 3D Globe
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-3">
                    {/* Inline attack counter on map */}
                    <div className="flex items-center gap-1.5 bg-[hsl(220,40%,8%)]/80 px-2.5 py-1 rounded-full border border-yellow-900/30">
                      <Zap className="h-3 w-3 text-yellow-400" />
                      <span className="text-[10px] font-bold text-yellow-300 tabular-nums">{attacksPerSecond} atk/s</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[hsl(220,40%,8%)]/80 px-2.5 py-1 rounded-full border border-cyan-900/30">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                      <span className="text-[10px] font-medium text-cyan-100/70">LIVE</span>
                    </div>
                  </div>
                </div>

                <TabsContent value="2d" className="mt-0">
                  <div className={`relative w-full ${isFullscreen ? "h-[calc(100vh-380px)]" : "h-[450px]"}`} style={{ backgroundColor: "hsl(220 50% 4%)" }}>
                    <ComposableMap
                      projectionConfig={{ scale: 180, center: [0, 20] }}
                      className="w-full h-full"
                      style={{ backgroundColor: "hsl(220 50% 4%)" }}
                    >
                      <defs>
                        {filteredFlows.map((flow) => (
                          <linearGradient key={`fg-${flow.id}`} id={`fg-${flow.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={getTypeColor(flow.threat_type)} stopOpacity="0" />
                            <stop offset={`${Math.max(flow.progress - 15, 0)}%`} stopColor={getTypeColor(flow.threat_type)} stopOpacity="0" />
                            <stop offset={`${flow.progress}%`} stopColor={getTypeColor(flow.threat_type)} stopOpacity="0.9" />
                            <stop offset={`${Math.min(flow.progress + 5, 100)}%`} stopColor={getTypeColor(flow.threat_type)} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={getTypeColor(flow.threat_type)} stopOpacity="0" />
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
                              stroke="hsl(200 60% 22%)"
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

                      {/* Heatmap overlay */}
                      {showHeatmap && countryStats.map((stat, idx) => {
                        const maxCount = Math.max(...countryStats.map((s) => s.count), 1);
                        const intensity = stat.count / maxCount;
                        if (stat.coordinates[0] === 0 && stat.coordinates[1] === 0) return null;
                        return (
                          <Marker key={`heat-${idx}`} coordinates={stat.coordinates}>
                            <circle r={50 * intensity + 15} fill="#ef4444" opacity={0.06 * intensity} style={{ filter: "blur(15px)" }} />
                            <circle r={30 * intensity + 10} fill="#f97316" opacity={0.1 * intensity} style={{ filter: "blur(8px)" }} />
                          </Marker>
                        );
                      })}

                      {/* Attack flow lines */}
                      {filteredFlows.map((flow) => (
                        <g key={flow.id}>
                          <Line from={flow.from} to={flow.to} stroke={getTypeColor(flow.threat_type)} strokeWidth={0.4} strokeOpacity={0.06} strokeLinecap="round" />
                          <Line from={flow.from} to={flow.to} stroke={`url(#fg-${flow.id})`} strokeWidth={1.5} strokeLinecap="round" />
                        </g>
                      ))}

                      {/* Threat origin markers */}
                      {filteredThreats.map((threat) => (
                        <Marker key={threat.id} coordinates={threat.coordinates}>
                          <circle r={6} fill={getTypeColor(threat.threat_type)} opacity={0.12} className="animate-ping" />
                          <circle r={3} fill={getTypeColor(threat.threat_type)} opacity={0.5} />
                          <circle r={1.5} fill="#fff" opacity={0.8} />
                        </Marker>
                      ))}

                      {/* Target markers */}
                      {targetLocations.map((coords, i) => (
                        <Marker key={`tgt-${i}`} coordinates={coords}>
                          <circle r={6} fill="#22d3ee" opacity={0.15} className="animate-ping" />
                          <circle r={3} fill="#22d3ee" opacity={0.5} />
                          <circle r={1.5} fill="#fff" opacity={0.9} />
                        </Marker>
                      ))}
                    </ComposableMap>

                    {/* Attack Types Legend */}
                    <div className="absolute top-3 left-3 bg-[hsl(220,45%,8%)]/90 backdrop-blur-sm rounded-lg p-3 border border-cyan-900/30 max-w-[180px]">
                      <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">Attack Types</p>
                      <div className="flex flex-col gap-1.5">
                        {Object.entries(attackTypeConfig).map(([key, cfg]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer group">
                            <Checkbox
                              checked={enabledTypes.has(key)}
                              onCheckedChange={() => toggleType(key)}
                              className="h-3.5 w-3.5 border-cyan-700/50 data-[state=checked]:border-transparent"
                              style={{
                                backgroundColor: enabledTypes.has(key) ? cfg.color : "transparent",
                                borderColor: enabledTypes.has(key) ? cfg.color : undefined,
                              }}
                            />
                            <span className="text-[10px] text-cyan-100/60 group-hover:text-cyan-100/90 transition-colors">
                              {cfg.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Severity Legend */}
                    <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] bg-[hsl(220,45%,8%)]/90 backdrop-blur-sm p-2.5 rounded-lg border border-cyan-900/30">
                      {[
                        { label: "Critical", color: "#ef4444" },
                        { label: "High", color: "#f97316" },
                        { label: "Medium", color: "#3b82f6" },
                        { label: "Low", color: "#22c55e" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                          <span className="text-cyan-100/50">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <TimelineBar threats={filteredThreats} />
                </TabsContent>

                <TabsContent value="3d" className="mt-0">
                  <div className={`relative w-full ${isFullscreen ? "h-[calc(100vh-380px)]" : "h-[450px]"}`}>
                    <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-[hsl(220,50%,4%)]"><Skeleton className="w-full h-full" /></div>}>
                      <Globe3D />
                    </Suspense>
                  </div>
                  <TimelineBar threats={filteredThreats} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="bg-[hsl(220,45%,8%)] border-cyan-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-100">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  Top Origin Countries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {countryStats.length === 0 ? (
                  <p className="text-sm text-cyan-200/40">No data</p>
                ) : (
                  countryStats.map((stat, idx) => (
                    <div key={stat.country} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(220,40%,10%)] hover:bg-[hsl(220,40%,14%)] transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400/50 w-4">#{idx + 1}</span>
                        <span className="text-xs font-medium text-cyan-100/80 truncate max-w-[100px]">{stat.country}</span>
                      </div>
                      <Badge className="text-[10px] bg-cyan-900/30 text-cyan-300 border-cyan-800/50">{stat.count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-[hsl(220,45%,8%)] border-cyan-900/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-100">
                  <Activity className="h-4 w-4 text-orange-400" />
                  Recent Attacks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredThreats.slice(0, 5).map((threat) => (
                  <div key={threat.id} className="p-2 rounded-lg bg-[hsl(220,40%,10%)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-cyan-100/80 truncate max-w-[120px]">{threat.title}</span>
                      <Badge className="text-[8px] px-1.5" style={{ backgroundColor: `${getSeverityColor(threat.severity)}25`, color: getSeverityColor(threat.severity), borderColor: `${getSeverityColor(threat.severity)}40` }}>
                        {threat.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-cyan-200/40">
                      <MapPin className="h-2.5 w-2.5" />
                      <span>{threat.country}</span>
                      <span>•</span>
                      <span className="capitalize">{threat.threat_type}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttackMap;
