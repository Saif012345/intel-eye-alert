import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { zoom } from "d3-zoom";
import { select } from "d3-selection";
import { scaleTime } from "d3-scale";
import { Clock } from "lucide-react";

interface TimelineEvent {
  id: string;
  title: string;
  timestamp: Date;
  severity: string;
  type: string;
  country: string;
}

const ThreatTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, k: 1 });

  useEffect(() => {
    fetchTimelineData();
  }, []);

  useEffect(() => {
    if (svgRef.current && events.length > 0) {
      const svg = select(svgRef.current);
      const zoomBehavior = zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", (event) => {
          setTransform({ x: event.transform.x, k: event.transform.k });
        });

      svg.call(zoomBehavior as any);
    }
  }, [events]);

  const fetchTimelineData = async () => {
    const { data, error } = await supabase
      .from("threats")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching timeline data:", error);
      return;
    }

    if (data) {
      const timelineEvents: TimelineEvent[] = data.map((threat) => ({
        id: threat.id,
        title: threat.title,
        timestamp: new Date(threat.created_at),
        severity: threat.severity,
        type: threat.threat_type,
        country: threat.country || "Unknown",
      }));
      setEvents(timelineEvents);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: "#ef4444",
      High: "#f97316",
      Medium: "#06b6d4",
      Low: "#10b981",
    };
    return colors[severity] || "#64748b";
  };

  const width = 1200;
  const height = 300;
  const padding = 50;

  if (events.length === 0) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Threat Timeline</h3>
        </div>
        <p className="text-muted-foreground">Loading timeline data...</p>
      </Card>
    );
  }

  const minDate = new Date(Math.min(...events.map((e) => e.timestamp.getTime())));
  const maxDate = new Date(Math.max(...events.map((e) => e.timestamp.getTime())));
  const xScale = scaleTime()
    .domain([minDate, maxDate])
    .range([padding, width - padding]);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Threat Timeline</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          Zoom with scroll • Pan with drag
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg ref={svgRef} width={width} height={height} className="cursor-move">
          <g transform={`translate(${transform.x}, 0) scale(${transform.k}, 1)`}>
            {/* Timeline axis */}
            <line
              x1={padding}
              y1={height / 2}
              x2={width - padding}
              y2={height / 2}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Time markers */}
            {events.map((event, idx) => {
              const x = xScale(event.timestamp);
              const y = height / 2 + (idx % 2 === 0 ? -80 : 80);
              const color = getSeverityColor(event.severity);

              return (
                <g key={event.id}>
                  {/* Connecting line */}
                  <line
                    x1={x}
                    y1={height / 2}
                    x2={x}
                    y2={y}
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.5"
                  />

                  {/* Event marker */}
                  <circle
                    cx={x}
                    cy={height / 2}
                    r="6"
                    fill={color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <title>{`${event.title} - ${event.severity} - ${event.country}`}</title>
                  </circle>

                  {/* Event label */}
                  <foreignObject x={x - 60} y={y - 30} width="120" height="60">
                    <div className="text-xs text-center">
                      <div
                        className="font-semibold truncate"
                        style={{ color }}
                        title={event.title}
                      >
                        {event.title.length > 20
                          ? event.title.substring(0, 20) + "..."
                          : event.title}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {event.timestamp.toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {event.country}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        {["Critical", "High", "Medium", "Low"].map((severity) => (
          <div key={severity} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getSeverityColor(severity) }}
            />
            <span className="text-muted-foreground">{severity}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ThreatTimeline;
