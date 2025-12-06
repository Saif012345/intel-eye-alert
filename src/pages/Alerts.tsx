import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RecentAlertsTable } from "@/components/dashboard/RecentAlertsTable";
import AlertPreferences from "@/components/AlertPreferences";

const Alerts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Alerts & Incidents</h1>
          <p className="text-muted-foreground">Security alerts and incident tracking</p>
        </div>
        <RecentAlertsTable />
        <AlertPreferences />
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
