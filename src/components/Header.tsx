import { Shield, Activity, AlertTriangle } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 glow-cyan">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">SentinelEye</h1>
              <p className="text-xs text-muted-foreground">Cyber Threat Intelligence Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
              <Activity className="w-4 h-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">System Status</p>
                <p className="text-sm font-semibold text-success">Operational</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Active Threats</p>
                <p className="text-sm font-semibold text-warning">2,847</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
