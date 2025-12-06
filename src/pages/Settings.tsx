import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your preferences</p>
        </div>
        
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <span className="text-sm">Theme:</span>
            <ThemeToggle />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
