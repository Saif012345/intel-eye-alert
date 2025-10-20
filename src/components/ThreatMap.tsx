import { Card } from "@/components/ui/card";

const ThreatMap = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">Global Threat Map</h2>
        <p className="text-sm text-muted-foreground">Real-time attack origins and targets</p>
      </div>
      
      <div className="relative w-full h-[400px] bg-secondary rounded-lg border border-border overflow-hidden">
        {/* Simplified world map representation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 800 400"
            className="w-full h-full opacity-20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100,200 Q150,150 200,200 T300,200 M350,180 L400,180 L420,200 L400,220 L350,220 Z M500,150 Q550,120 600,150 L620,180 L600,210 L550,210 Z M150,250 L200,250 L220,280 L200,300 L150,300 Z M450,260 Q500,240 550,260 L570,290 L550,310 L500,310 Z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
        </div>
        
        {/* Attack indicators */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-destructive rounded-full animate-ping" />
        <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-warning rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-2/3 left-1/3 w-3 h-3 bg-destructive rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-warning rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-destructive rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
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
        </div>
      </div>
    </Card>
  );
};

export default ThreatMap;
