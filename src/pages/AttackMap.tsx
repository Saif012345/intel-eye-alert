import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Target, Activity, MapPin, Filter, Maximize2, Minimize2 } from "lucide-react";

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

const countryCoordinates: Record<string, [number, number]> = {
  "United States": [-95, 38],
  "USA": [-95, 38],
  "Russia": [100, 60],
  "China": [105, 35],
  "Nigeria": [8, 10],
  "Brazil": [-55, -10],
  "India": [78, 22],
  "Germany": [10, 51],
  "United Kingdom": [-2, 54],
  "UK": [-2, 54],
  "France": [2, 47],
  "Japan": [138, 36],
  "Australia": [134, -25],
  "Canada": [-106, 56],
  "Iran": [53, 32],
  "North Korea": [127, 40],
  "Unknown": [0, 0],
};

const defaultCoords: [number, number][] = [
  [-74, 40], [0, 51], [139, 35], [-122, 37], [2, 48],
  [37, 55], [-43, -22], [151, -33], [13, 52], [121, 31],
  [72, 19], [-99, 19], [103, 1], [77, 28], [-3, 40]
];

const AttackMap = () => {
  const [threats, setThreats] = useState<ThreatLocation[]>([]);
  const [connections, setConnections] = useState<Array<{ from: [number, number]; to: [number, number]; severity: string }>>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [selectedThreatType, setSelectedThreatType] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<CountryStats | null>(null);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 10000);
    return () => clearInterval(interval);
  }, [selectedThreatType, selectedSeverity]);

  const fetchThreats = async () => {
    let query = supabase
      .from('threats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (selectedThreatType !== "all") {
      query = query.eq('threat_type', selectedThreatType);
    }
    if (selectedSeverity !== "all") {
      query = query.eq('severity', selectedSeverity);
    }

    const { data } = await query;

    if (data) {
      const locations: ThreatLocation[] = data.map((threat) => ({
        id: threat.id,
        coordinates: countryCoordinates[threat.country || "Unknown"] || 
          defaultCoords[Math.floor(Math.random() * defaultCoords.length)],
        severity: threat.severity,
        country: threat.country || 'Unknown',
        title: threat.title,
        threat_type: threat.threat_type,
        created_at: threat.created_at
      }));
      setThreats(locations);

      // Calculate country statistics
      const statsMap = new Map<string, number>();
      data.forEach((threat) => {
        const country = threat.country || 'Unknown';
        statsMap.set(country, (statsMap.get(country) || 0) + 1);
      });
      
      const stats: CountryStats[] = Array.from(statsMap.entries())
        .map(([country, count]) => ({
          country,
          count,
          coordinates: countryCoordinates[country] || [0, 0]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setCountryStats(stats);

      // Generate attack connections (simulating attack flows)
      const newConnections = [];
      const targetCoords: [number, number] = [-95, 38]; // US as primary target
      for (let i = 0; i < Math.min(8, locations.length); i++) {
        if (locations[i].coordinates[0] !== targetCoords[0]) {
          newConnections.push({
            from: locations[i].coordinates,
            to: targetCoords,
            severity: locations[i].severity
          });
        }
      }
      setConnections(newConnections);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "hsl(var(--destructive))",
      high: "hsl(var(--warning))",
      medium: "hsl(var(--primary))",
      low: "hsl(var(--success))"
    };
    return colors[severity] || "hsl(var(--primary))";
  };

  const getSeverityBadgeVariant = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return variants[severity] || "secondary";
  };

  const threatTypes = ["malware", "phishing", "ransomware", "botnet", "exploit", "apt"];

  return (
    <DashboardLayout>
      <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Global Attack Map
            </h1>
            <p className="text-muted-foreground">Real-time threat visualization and origin tracking</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedThreatType} onValueChange={setSelectedThreatType}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Attack Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {threatTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[140px]">
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
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/20">
                  <Target className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{threats.filter(t => t.severity === 'critical').length}</p>
                  <p className="text-xs text-muted-foreground">Critical Attacks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{threats.length}</p>
                  <p className="text-xs text-muted-foreground">Active Threats</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{countryStats.length}</p>
                  <p className="text-xs text-muted-foreground">Origin Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20">
                  <Globe className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connections.length}</p>
                  <p className="text-xs text-muted-foreground">Attack Flows</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map - Takes 3 columns */}
          <div className="lg:col-span-3">
            <Card className="glass border-border/50 overflow-hidden">
              <div className={`relative w-full ${isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-[600px]'} bg-secondary`}>
                <ComposableMap
                  projectionConfig={{ scale: 180, center: [0, 20] }}
                  className="w-full h-full"
                >
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill="hsl(var(--secondary))"
                          stroke="hsl(var(--border))"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "hsl(var(--muted))" },
                            pressed: { outline: "none" },
                          }}
                        />
                      ))
                    }
                  </Geographies>

                  {/* Attack flow lines */}
                  {connections.map((conn, idx) => (
                    <Line
                      key={`line-${idx}`}
                      from={conn.from}
                      to={conn.to}
                      stroke={getSeverityColor(conn.severity)}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeOpacity={0.6}
                      className="animate-pulse"
                    />
                  ))}

                  {/* Threat markers */}
                  {threats.map((threat) => (
                    <Marker key={threat.id} coordinates={threat.coordinates}>
                      <circle
                        r={6}
                        fill={getSeverityColor(threat.severity)}
                        className="animate-ping"
                        style={{
                          filter: `drop-shadow(0 0 12px ${getSeverityColor(threat.severity)})`
                        }}
                      />
                      <circle
                        r={5}
                        fill={getSeverityColor(threat.severity)}
                        opacity={0.9}
                      />
                    </Marker>
                  ))}
                </ComposableMap>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 flex gap-4 text-xs bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
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

                {/* Live indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-xs font-medium">LIVE</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Country Stats */}
          <div className="space-y-4">
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Top Origin Countries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {countryStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No threat data available</p>
                ) : (
                  countryStats.map((stat, idx) => (
                    <div
                      key={stat.country}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                      onMouseEnter={() => setHoveredCountry(stat)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-4">#{idx + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[120px]">{stat.country}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stat.count}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-warning" />
                  Recent Attacks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {threats.slice(0, 5).map((threat) => (
                  <div key={threat.id} className="p-2 rounded-lg bg-secondary/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[140px]">{threat.title}</span>
                      <Badge variant={getSeverityBadgeVariant(threat.severity)} className="text-[10px] px-1.5">
                        {threat.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
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