import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ForceGraph2D from "react-force-graph-2d";
import { Network } from "lucide-react";

interface GraphNode {
  id: string;
  name: string;
  severity: string;
  type: string;
  country: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NetworkGraph = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<any>();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    const { data, error } = await supabase
      .from("threats")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching graph data:", error);
      return;
    }

    if (data) {
      // Create nodes
      const nodes: GraphNode[] = data.map((threat) => ({
        id: threat.id,
        name: threat.title,
        severity: threat.severity,
        type: threat.threat_type,
        country: threat.country || "Unknown",
        val: threat.severity === "Critical" ? 15 : threat.severity === "High" ? 10 : 5,
      }));

      // Create links based on shared attributes
      const links: GraphLink[] = [];
      for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
          const threat1 = data[i];
          const threat2 = data[j];

          // Link if same country or same threat type
          if (
            threat1.country === threat2.country ||
            threat1.threat_type === threat2.threat_type
          ) {
            links.push({
              source: threat1.id,
              target: threat2.id,
              value: threat1.country === threat2.country ? 2 : 1,
            });
          }
        }
      }

      setGraphData({ nodes, links });
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

  const handleNodeClick = (node: any) => {
    setSelectedNode(node as GraphNode);
    // Center on clicked node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Threat Network Graph</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          Click nodes to explore • Drag to pan
        </span>
      </div>

      <div className="relative">
        {graphData.nodes.length > 0 ? (
          <>
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={800}
              height={500}
              backgroundColor="rgba(0,0,0,0)"
              nodeLabel={(node: any) => `${node.name} (${node.severity})`}
              nodeColor={(node: any) => getSeverityColor(node.severity)}
              nodeRelSize={6}
              linkColor={() => "rgba(56, 189, 248, 0.3)"}
              linkWidth={(link: any) => link.value}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = getSeverityColor(node.severity);
                
                // Draw node circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                ctx.fill();
                
                // Draw label
                ctx.fillStyle = "#f3f4f6";
                if (globalScale > 1.5) {
                  ctx.fillText(label.substring(0, 20), node.x, node.y + node.val + 10);
                }
              }}
            />

            {selectedNode && (
              <div className="absolute top-4 right-4 bg-background/95 backdrop-blur p-4 rounded-lg border border-primary/20 max-w-xs">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
                <h4 className="font-semibold mb-2 pr-4">{selectedNode.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSeverityColor(selectedNode.severity) }}
                    />
                    <span className="text-muted-foreground">
                      Severity: {selectedNode.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground">Type: {selectedNode.type}</p>
                  <p className="text-muted-foreground">Country: {selectedNode.country}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            Loading network graph...
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <span className="text-muted-foreground">Node Size = Severity</span>
        <span className="text-muted-foreground">Links = Shared Attributes</span>
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

export default NetworkGraph;
