import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ThreatMap from "@/components/ThreatMap";

const AttackMap = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Global Attack Map</h1>
          <p className="text-muted-foreground">Real-time threat visualization</p>
        </div>
        <ThreatMap />
      </div>
    </DashboardLayout>
  );
};

export default AttackMap;
